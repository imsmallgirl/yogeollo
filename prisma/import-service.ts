// Node-only CLI data operations. No application route imports or exposes this module.
import { z } from "zod";
import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { boardGameRecordSchema, gameFactsSchema, gameEditorialSchema } from "../src/domain/games/schema";
import { contentDigest } from "../src/domain/data-import/digest";
import { importPackageSchema, ImportError } from "../src/domain/data-import/schema";
import { planImport } from "../src/domain/data-import/plan";

const graph = {
  editorial: true,
  sources: { orderBy: { sourceUrl: "asc" }, include: { observations: { orderBy: { verifiedAt: "asc" } } } },
  externalIds: { orderBy: [{ provider: "asc" }, { externalId: "asc" }] },
} satisfies Prisma.BoardGameInclude;
type StoredGame = Prisma.BoardGameGetPayload<{ include: typeof graph }>;
const sourceParser = boardGameRecordSchema.shape.sources.element;

export function storedGameRecord(row: StoredGame) {
  return boardGameRecordSchema.parse({
    facts: gameFactsSchema.strip().parse({ ...row, complexity: row.complexity?.toNumber() ?? null, lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null }),
    editorial: row.editorial ? gameEditorialSchema.strip().parse({ ...row.editorial, reviewedAt: row.editorial.reviewedAt?.toISOString() ?? null }) : null,
    sources: row.sources.map((source) => sourceParser.strip().parse({
      ...source, verifiedAt: source.verifiedAt.toISOString(),
      observations: source.observations.map((observation) => sourceParser.shape.observations.element.strip().parse({ ...observation, verifiedAt: observation.verifiedAt.toISOString() })),
    })),
    externalIds: row.externalIds.map(({ provider, externalId }) => ({ provider, externalId })),
  });
}

function jsonObject(value: unknown): Prisma.InputJsonObject {
  const parsed: unknown = JSON.parse(JSON.stringify(value));
  return z.record(z.string(), z.json()).parse(parsed);
}

function baseState(rows: StoredGame[], slugs: string[]) {
  return jsonObject(Object.fromEntries(slugs.map((slug) => [slug, rows.find((row) => row.slug === slug) ?? null])));
}

async function serializable<T>(database: PrismaClient, work: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await database.$transaction(work, { isolationLevel: "Serializable", timeout: 60_000 });
    } catch (error) {
      const retryable = typeof error === "object" && error !== null && "code" in error && ["P2034", "P2002"].includes(String(error.code));
      if (attempt >= 2 || !retryable) throw error;
    }
  }
}

async function currentState(transaction: Prisma.TransactionClient) {
  const rows = await transaction.boardGame.findMany({ orderBy: { slug: "asc" }, include: graph });
  return { rows, records: rows.map(storedGameRecord) };
}

function assertUnchanged(stored: unknown, current: unknown) {
  if (contentDigest(stored) !== contentDigest(current)) throw new ImportError("BASE_CHANGED", "검토 대상의 DB 상태가 변경됐습니다. 새 revision으로 다시 제출하고 검토해 주세요.");
}

export async function stageImport(database: PrismaClient, input: unknown, now = new Date()) {
  const payload = importPackageSchema.parse(input);
  const digest = contentDigest(payload);
  return serializable(database, async (transaction) => {
    const previous = await transaction.importBatch.findUnique({ where: { digest } });
    if (previous) return previous;
    const { rows, records } = await currentState(transaction);
    const plan = planImport(payload, records, now.toISOString());
    return transaction.importBatch.create({ data: {
      digest, payload: jsonObject(payload), plan: jsonObject(plan),
      baseState: baseState(rows, payload.games.map((game) => game.facts.slug)),
    } });
  });
}

const reviewSchema = z.strictObject({
  id: z.uuid(), expectedDigest: z.string().regex(/^[a-f0-9]{64}$/),
  decision: z.enum(["approve", "reject"]),
  reviewer: z.string().trim().min(1).max(200), notes: z.string().trim().min(1).max(4000),
});

export async function reviewImport(database: PrismaClient, input: z.infer<typeof reviewSchema>, now = new Date()) {
  const review = reviewSchema.parse(input);
  return serializable(database, async (transaction) => {
    const batch = await transaction.importBatch.findUniqueOrThrow({ where: { id: review.id } });
    if (batch.digest !== review.expectedDigest || contentDigest(batch.payload) !== batch.digest) throw new ImportError("DIGEST_MISMATCH", "검토한 파일 내용의 해시가 일치하지 않습니다.");
    const status = review.decision === "approve" ? "APPROVED" : "REJECTED";
    if (batch.status !== "PENDING") {
      if ((batch.status === status || (status === "APPROVED" && batch.status === "APPLIED")) && batch.reviewedBy === review.reviewer && batch.reviewNotes === review.notes) return batch;
      throw new ImportError("REVIEW_FINAL", "이미 완료된 검토는 덮어쓸 수 없습니다.");
    }
    if (review.decision === "approve") {
      const payload = importPackageSchema.parse(batch.payload);
      const { rows, records } = await currentState(transaction);
      assertUnchanged(batch.baseState, baseState(rows, payload.games.map((game) => game.facts.slug)));
      if (planImport(payload, records, now.toISOString()).issues.length) throw new ImportError("REVIEW_BLOCKED", "수집 권한·출처·중복·판본 충돌을 먼저 해결해야 합니다.");
    }
    return transaction.importBatch.update({ where: { id: batch.id }, data: { status, reviewedBy: review.reviewer, reviewNotes: review.notes, reviewedAt: now } });
  });
}

export async function applyImport(database: PrismaClient, id: string, now = new Date()) {
  z.uuid().parse(id);
  return serializable(database, async (transaction) => {
    const batch = await transaction.importBatch.findUniqueOrThrow({ where: { id } });
    if (contentDigest(batch.payload) !== batch.digest) throw new ImportError("DIGEST_MISMATCH", "승인한 내용이 변경돼 반영할 수 없습니다.");
    if (batch.status === "APPLIED") return batch;
    if (batch.status !== "APPROVED") throw new ImportError("NOT_APPROVED", "명시적으로 승인된 대기 자료만 반영할 수 있습니다.");
    const payload = importPackageSchema.parse(batch.payload);
    const current = await currentState(transaction);
    assertUnchanged(batch.baseState, baseState(current.rows, payload.games.map((game) => game.facts.slug)));
    const plan = planImport(payload, current.records, now.toISOString());
    if (plan.issues.length) throw new ImportError("APPLY_BLOCKED", "현재 DB에 해결되지 않은 충돌이 있어 반영하지 않았습니다.");
    for (const game of payload.games) {
      const change = plan.changes.find((item) => item.slug === game.facts.slug);
      if (change?.action === "NOOP") continue;
      const previous = current.rows.find((item) => item.slug === game.facts.slug);
      const saved = previous ? await transaction.boardGame.update({ where: { id: previous.id }, data: game.facts }) : await transaction.boardGame.create({ data: game.facts });
      for (const source of game.sources) {
        const oldSource = previous?.sources.find((item) => item.sourceUrl === source.sourceUrl);
        const savedSource = oldSource ? await transaction.gameSource.update({ where: { id: oldSource.id }, data: { verifiedAt: source.verifiedAt } }) :
          await transaction.gameSource.create({ data: { boardGameId: saved.id, sourceName: source.sourceName, sourceUrl: source.sourceUrl, sourceType: source.sourceType, verifiedAt: source.verifiedAt } });
        for (const observation of source.observations) {
          if (oldSource?.observations.some((item) => item.verifiedAt.getTime() === Date.parse(observation.verifiedAt))) continue;
          await transaction.sourceObservation.create({ data: { ...observation, gameSourceId: savedSource.id } });
        }
      }
      for (const external of game.externalIds) {
        if (previous?.externalIds.some((item) => item.provider.trim().toLowerCase() === external.provider.trim().toLowerCase())) continue;
        await transaction.externalGameId.create({ data: { ...external, boardGameId: saved.id } });
      }
      // Existing editorial and omitted source history/external IDs are preserved.
    }
    const after = await currentState(transaction);
    return transaction.importBatch.update({ where: { id }, data: {
      status: "APPLIED", appliedAt: now,
      result: jsonObject({ changes: plan.changes, afterState: baseState(after.rows, payload.games.map((game) => game.facts.slug)) }),
    } });
  });
}

export async function inspectImport(database: PrismaClient, id: string) {
  z.uuid().parse(id);
  return database.importBatch.findUniqueOrThrow({ where: { id } });
}

export async function publicationCandidate(database: PrismaClient, slug: string) {
  gameFactsSchema.shape.slug.parse(slug);
  const row = await database.boardGame.findUniqueOrThrow({ where: { slug }, include: graph });
  return storedGameRecord(row);
}
