import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createDatabaseClient } from "../../prisma/client";
import { loadSeedGames, seedGames } from "../../prisma/seed-data";
import { parseDatabaseUrl } from "../../src/lib/database-env";
import type { Prisma } from "../../src/generated/prisma/client";

vi.mock("server-only", () => ({}));
const { listVerifiedBoardGames } = await import("../../src/server/games");

// Require an explicitly named disposable test DB; never use DATABASE_URL implicitly.
const testUrl = parseDatabaseUrl(process.env.TEST_DATABASE_URL);
if (!new URL(testUrl).pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL은 이름이 _test로 끝나는 전용 DB여야 합니다.");
}
const database = createDatabaseClient(testUrl);
const sample = loadSeedGames()[0];
const rollback = new Error("test-rollback");

async function rolledBack(work: (transaction: Prisma.TransactionClient) => Promise<void>) {
  try {
    await database.$transaction(async (transaction) => {
      await work(transaction);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe("PostgreSQL 마이그레이션과 샘플", () => {
  beforeAll(async () => {
    await seedGames(database);
  });
  afterAll(async () => {
    await database.$disconnect();
  });

  it("seed를 다시 실행해도 ID·출처·관측·편집을 중복 생성하지 않는다", async () => {
    const before = await database.boardGame.findUniqueOrThrow({
      where: { slug: "splendor" },
      include: { sources: { include: { observations: true } }, editorial: true },
    });
    await seedGames(database);
    const after = await database.boardGame.findUniqueOrThrow({
      where: { slug: "splendor" },
      include: { sources: { include: { observations: true } }, editorial: true },
    });
    expect(after).toEqual(before);
    expect(after.sources).toHaveLength(2);
    expect(after.sources.flatMap((source) => source.observations)).toHaveLength(2);
  });

  it("서버 조회는 검증된 사실만 반환하고 미검토 편집은 숨긴다", async () => {
    const records = await listVerifiedBoardGames(database);
    expect(records).toHaveLength(loadSeedGames().length);
    expect(records.some((record) => record.facts.slug === "dobble")).toBe(true);
    expect(records.every((record) => record.facts.domesticAvailability === "LISTED")).toBe(true);
    expect(records.every((record) => record.editorial === null)).toBe(true);
    expect(JSON.parse(JSON.stringify(records))).toEqual(records);
  });

  it.each(["PENDING", "STALE", "REJECTED"] as const)("%s 상태는 기본 서버 조회에서 제외한다", async (verificationStatus) => {
    await rolledBack(async (transaction) => {
      await transaction.boardGame.update({ where: { slug: "splendor" }, data: { verificationStatus } });
      expect((await listVerifiedBoardGames(transaction)).some((record) => record.facts.slug === "splendor")).toBe(false);
    });
  });

  it("seed가 기존 자체 편집을 덮어쓰지 않는다", async () => {
    const game = await database.boardGame.findUniqueOrThrow({ where: { slug: "splendor" } });
    const original = await database.gameEditorial.findUniqueOrThrow({ where: { boardGameId: game.id } });
    try {
      await database.gameEditorial.update({ where: { id: original.id }, data: { author: "테스트 전용 편집 보존" } });
      await seedGames(database);
      expect((await database.gameEditorial.findUniqueOrThrow({ where: { id: original.id } })).author).toBe("테스트 전용 편집 보존");
    } finally {
      await database.gameEditorial.update({ where: { id: original.id }, data: { author: original.author, updatedAt: original.updatedAt } });
    }
  });

  it.each([
    { minPlayers: 0 }, { maxPlayers: 1 }, { minPlayTime: 0 }, { maxPlayTime: 15 },
    { averagePlayTime: 60 }, { complexity: 2 }, { complexityScale: "test-only" }, { lastVerifiedAt: null },
  ])("SQL 제약도 잘못된 사실 변경을 거부한다: %j", async (data) => {
    await expect(rolledBack(async (transaction) => {
      await transaction.boardGame.update({ where: { slug: "splendor" }, data });
    })).rejects.toThrow();
  });

  it.each([[5], [2, 2]])("SQL이 범위 밖·중복 추천 인원을 거부한다: %j", async (...players) => {
    const game = await database.boardGame.findUniqueOrThrow({ where: { slug: "splendor" } });
    await expect(rolledBack(async (transaction) => {
      await transaction.gameEditorial.update({ where: { boardGameId: game.id }, data: { bestPlayers: players } });
    })).rejects.toThrow();
  });

  it("인원 범위를 변경해 기존 편집의 추천 인원을 무효화할 수 없다", async () => {
    const game = await database.boardGame.findUniqueOrThrow({ where: { slug: "splendor" } });
    await expect(rolledBack(async (transaction) => {
      await transaction.gameEditorial.update({ where: { boardGameId: game.id }, data: { bestPlayers: [4] } });
      await transaction.boardGame.update({ where: { id: game.id }, data: { maxPlayers: 3 } });
    })).rejects.toThrow();
  });

  it("게임 slug 중복과 출처 FK 없는 레코드를 거부한다", async () => {
    await expect(rolledBack(async (transaction) => {
      await transaction.boardGame.create({ data: sample.facts });
    })).rejects.toThrow();
    await expect(rolledBack(async (transaction) => {
      await transaction.gameSource.create({ data: {
        boardGameId: "00000000-0000-4000-8000-000000000000",
        sourceName: "테스트 전용 FK 검증", sourceUrl: "https://example.invalid",
        sourceType: "PUBLIC_DATA", verifiedAt: new Date(),
      } });
    })).rejects.toThrow();
  });

  it("외부 ID의 제공자별·게임별 고유성을 보장한다", async () => {
    const game = await database.boardGame.findUniqueOrThrow({ where: { slug: "splendor" } });
    for (const external of [
      { provider: "test-only", externalId: "second" },
      { provider: "test-only", externalId: "first" },
    ]) {
      await expect(rolledBack(async (transaction) => {
        await transaction.externalGameId.create({ data: { boardGameId: game.id, provider: "test-only", externalId: "first" } });
        await transaction.externalGameId.create({ data: { boardGameId: game.id, ...external } });
      })).rejects.toThrow();
    }
    await expect(rolledBack(async (transaction) => {
      const other = await transaction.boardGame.create({ data: { ...sample.facts, slug: "test-only-other" } });
      await transaction.externalGameId.create({ data: { boardGameId: game.id, provider: "test-only", externalId: "first" } });
      await transaction.externalGameId.create({ data: { boardGameId: other.id, provider: "test-only", externalId: "first" } });
    })).rejects.toThrow();
  });

  it("감사 출처가 있는 게임의 실수 삭제를 차단한다", async () => {
    await expect(rolledBack(async (transaction) => {
      await transaction.boardGame.delete({ where: { slug: "splendor" } });
    })).rejects.toThrow();
  });
});
