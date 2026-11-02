import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "../../prisma/client";
import { applyImport, publicationCandidate, reviewImport, stageImport } from "../../prisma/import-service";
import { makeGame } from "../../src/domain/recommendation/__tests__/fixtures";
import { importPackageSchema, type ImportPackage } from "../../src/domain/data-import/schema";
import { parseDatabaseUrl } from "../../src/lib/database-env";

const url = parseDatabaseUrl(process.env.IMPORT_TEST_DATABASE_URL);
if (!new URL(url).pathname.endsWith("_test") || url === process.env.TEST_DATABASE_URL) throw new Error("IMPORT_TEST_DATABASE_URL은 기존 테스트와 다른 전용 _test DB여야 합니다.");
const db = createDatabaseClient(url);
afterAll(() => db.$disconnect());
function payload(): ImportPackage {
  const slug = `import-${randomUUID()}`;
  return importPackageSchema.parse({ version: 1, revision: 1, label: "통합 테스트 합성 자료", collectedBy: "테스트", collectedAt: "2026-11-02T17:00:00Z", acquisition: { method: "MANUAL_REVIEW", permissionStatus: "CONFIRMED", permissionBasis: "실제 수집 권한을 주장하지 않는 테스트" }, games: [makeGame(slug, { editorial: null })] });
}
async function approve(batch: Awaited<ReturnType<typeof stageImport>>) {
  return reviewImport(db, { id: batch.id, expectedDigest: batch.digest, decision: "approve", reviewer: "합성 테스트", notes: "테스트 픽스처만 승인" });
}
async function imported() {
  const input = payload(); const batch = await stageImport(db, input); await approve(batch); await applyImport(db, batch.id);
  return { input, batch, record: await publicationCandidate(db, input.games[0].facts.slug) };
}

describe("PostgreSQL 가져오기 승인·트랜잭션", () => {
  it("동일 파일을 재접수해도 같은 대기 기록이며 게임을 쓰지 않는다", async () => {
    const input = payload(); const one = await stageImport(db, input); const two = await stageImport(db, JSON.parse(JSON.stringify(input)));
    expect(two.id).toBe(one.id); expect(two.status).toBe("PENDING");
    expect(await db.boardGame.findUnique({ where: { slug: input.games[0].facts.slug } })).toBeNull();
    await expect(applyImport(db, one.id)).rejects.toMatchObject({ code: "NOT_APPROVED" });
  });
  it("승인과 반영을 반복해도 ID·게임·관측이 중복되지 않는다", async () => {
    const input = payload(); const batch = await stageImport(db, input);
    await expect(reviewImport(db, { id: batch.id, expectedDigest: "0".repeat(64), decision: "approve", reviewer: "테스트", notes: "테스트" })).rejects.toMatchObject({ code: "DIGEST_MISMATCH" });
    await approve(batch); await approve(batch);
    const first = await applyImport(db, batch.id); expect(first.status).toBe("APPLIED");
    expect(await applyImport(db, batch.id)).toEqual(first);
    const record = await publicationCandidate(db, input.games[0].facts.slug);
    expect(record.sources[0].observations).toHaveLength(1);
    expect(record.editorial).toBeNull();
    await approve(batch);
  });
  it("미확인 권한은 승인할 수 없지만 반려 사유는 남길 수 있다", async () => {
    const input = payload(); input.acquisition.permissionStatus = "UNCONFIRMED";
    const batch = await stageImport(db, input);
    await expect(approve(batch)).rejects.toMatchObject({ code: "REVIEW_BLOCKED" });
    const rejection = { id: batch.id, expectedDigest: batch.digest, decision: "reject" as const, reviewer: "테스트", notes: "권한 미확인" };
    expect((await reviewImport(db, rejection)).status).toBe("REJECTED");
    expect((await reviewImport(db, rejection)).status).toBe("REJECTED");
    await expect(approve(batch)).rejects.toMatchObject({ code: "REVIEW_FINAL" });
    await expect(applyImport(db, batch.id)).rejects.toMatchObject({ code: "NOT_APPROVED" });
  });
  it("동시에 접수·반영해도 중복을 생성하지 않는다", async () => {
    const input = payload(); const [one, two] = await Promise.all([stageImport(db, input), stageImport(db, input)]);
    expect(one.id).toBe(two.id); await approve(one);
    const [first, second] = await Promise.all([applyImport(db, one.id), applyImport(db, one.id)]);
    expect(first.id).toBe(second.id); expect(first.status).toBe("APPLIED"); expect(second.status).toBe("APPLIED");
    expect(await db.boardGame.count({ where: { slug: input.games[0].facts.slug } })).toBe(1);
  });
  it("검토 전 DB 변경과 승인 후 DB 변경을 모두 감지한다", async () => {
    const { input } = await imported(); input.revision++;
    const batch = await stageImport(db, input);
    await db.boardGame.update({ where: { slug: input.games[0].facts.slug }, data: { verificationStatus: "STALE" } });
    await expect(approve(batch)).rejects.toMatchObject({ code: "BASE_CHANGED" });
    const other = payload(); const staged = await stageImport(db, other); await approve(staged);
    await db.boardGame.create({ data: { ...other.games[0].facts, verificationStatus: "PENDING" } });
    await expect(applyImport(db, staged.id)).rejects.toMatchObject({ code: "BASE_CHANGED" });
    expect((await db.importBatch.findUniqueOrThrow({ where: { id: staged.id } })).status).toBe("APPROVED");
  });
  it("기존 자체 편집·관측·외부 ID를 보존하고 새 관측만 추가한다", async () => {
    const { input } = await imported(); const game = await db.boardGame.findUniqueOrThrow({ where: { slug: input.games[0].facts.slug } });
    const editorial = makeGame(game.slug).editorial!;
    await db.gameEditorial.create({ data: { ...editorial, boardGameId: game.id } });
    await db.externalGameId.create({ data: { boardGameId: game.id, provider: "test-only", externalId: randomUUID() } });
    const before = await db.gameEditorial.findUniqueOrThrow({ where: { boardGameId: game.id } });
    input.revision++; const source = input.games[0].sources[0];
    const next = structuredClone(source.observations[0]); next.verifiedAt = "2026-11-02T17:30:00Z";
    source.verifiedAt = next.verifiedAt; source.observations = [next];
    input.games[0].facts.lastVerifiedAt = next.verifiedAt;
    const batch = await stageImport(db, input); await approve(batch); await applyImport(db, batch.id);
    const after = await publicationCandidate(db, game.slug);
    expect(after.sources[0].observations).toHaveLength(2); expect(after.externalIds).toHaveLength(1);
    expect(await db.gameEditorial.findUniqueOrThrow({ where: { boardGameId: game.id } })).toEqual(before);
  });
  it("SQL이 관측 수정·삭제와 대기 내용 변경·승인 메타데이터 누락을 차단한다", async () => {
    const { batch, record } = await imported();
    const observation = await db.sourceObservation.findFirstOrThrow({ where: { gameSource: { boardGame: { slug: record.facts.slug } } } });
    await expect(db.sourceObservation.update({ where: { id: observation.id }, data: { evidenceNoteKo: "변조" } })).rejects.toThrow();
    await expect(db.sourceObservation.delete({ where: { id: observation.id } })).rejects.toThrow();
    await expect(db.importBatch.update({ where: { id: batch.id }, data: { payload: {} } })).rejects.toThrow();
    await expect(db.importBatch.delete({ where: { id: batch.id } })).rejects.toThrow();
    const pending = await stageImport(db, payload());
    await expect(db.importBatch.update({ where: { id: pending.id }, data: { status: "APPROVED", reviewedAt: new Date() } })).rejects.toThrow();
    expect((await db.importBatch.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("PENDING");
  });
  it("두 번째 게임 쓰기 실패 시 첫 번째 게임과 반영 상태도 롤백한다", async () => {
    const input = payload(); const second = payload().games[0]; input.games.push(second);
    const batch = await stageImport(db, input); await approve(batch);
    // Controlled DB fault in this isolated disposable database; never installed in application schema.
    await db.$executeRawUnsafe(`CREATE FUNCTION import_test_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."slug" = '${second.facts.slug}' THEN RAISE EXCEPTION 'test fault'; END IF; RETURN NEW; END; $$`);
    await db.$executeRawUnsafe('CREATE TRIGGER import_test_fault BEFORE INSERT ON "BoardGame" FOR EACH ROW EXECUTE FUNCTION import_test_fault()');
    try {
      await expect(applyImport(db, batch.id)).rejects.toThrow();
      expect(await db.boardGame.count({ where: { slug: { in: input.games.map((game) => game.facts.slug) } } })).toBe(0);
      expect((await db.importBatch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe("APPROVED");
    } finally {
      await db.$executeRawUnsafe('DROP TRIGGER import_test_fault ON "BoardGame"');
      await db.$executeRawUnsafe('DROP FUNCTION import_test_fault()');
    }
  });
});
