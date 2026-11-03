import { describe, expect, it } from "vitest";
import { loadGameDataset } from "../../../data/catalog";
import { recommend } from "../recommendation/recommend";

describe("실제 출처 대조 카탈로그", () => {
  it("전체 15개와 서로 다른 신규 상품 14개의 출처·필드 근거를 검증한다", () => {
    const games = loadGameDataset();
    expect(games).toHaveLength(15);
    expect(new Set(games.map((game) => game.facts.slug)).size).toBe(games.length);
    const additions = games.filter((game) => game.facts.slug !== "splendor");
    expect(new Set(additions.flatMap((game) => game.externalIds.map((id) => id.externalId))).size).toBe(14);
    for (const game of additions) {
      expect(game.editorial).toBeNull();
      expect(game.sources[0].sourceType).toBe("DOMESTIC_DISTRIBUTOR");
      expect(game.sources[0].sourceUrl).toContain(`goodsNo=${game.externalIds[0].externalId}`);
      expect(game.sources[0].observations[0].usageStatus).toBe("FACTS_ONLY");
      expect(game.facts.verificationStatus).toBe("VERIFIED");
      expect(game.facts.domesticAvailability).toBe("LISTED");
      expect(game.facts.domesticPopularityStatus).toBe("UNKNOWN");
      expect(game.facts.domesticPlayStatus).toBe("UNKNOWN");
      expect(game.facts.koreanEdition).toBe("UNKNOWN");
      expect(game.facts.averagePlayTime).toBeNull();
      expect(game.facts.complexity).toBeNull();
    }
  });
  it.each([2, 4, 8, 10, 11])("%i명 모임도 실제 가능 인원과 표기 시간으로만 추천한다", (playerCount) => {
    const result = recommend(loadGameDataset(), { playerCount, playTime: "BETWEEN_15_30", mood: "RELAXED", difficulty: "ANY" });
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
    expect(result.recommendations.every(({ game }) => game.minPlayers <= playerCount && game.maxPlayers >= playerCount)).toBe(true);
    expect(new Set(result.recommendations.map(({ game }) => game.slug)).size).toBe(result.recommendations.length);
    if (playerCount === 11) expect(result.recommendations).toEqual([]);
    if (playerCount === 4 || playerCount === 8) expect(result.recommendations).toHaveLength(5);
    if (playerCount === 10) expect(result.recommendations.map(({ game }) => game.slug).sort()).toEqual(["6-nimmt", "saboteur"]);
    expect(result.recommendations.flatMap(({ reasons }) => reasons).filter((reason) => ["MOOD", "DIFFICULTY", "BEST_PLAYERS"].includes(reason.code) && reason.kind === "MATCH")).toEqual([]);
  });
  it("같은 모델명 표기가 있어도 상품번호가 다른 게임을 합치지 않는다", () => {
    const games = loadGameDataset();
    expect(games.find((game) => game.facts.slug === "great-dalmuti")?.externalIds).toEqual([{ provider: "akongdakong", externalId: "916" }]);
    expect(games.find((game) => game.facts.slug === "6-nimmt")?.externalIds).toEqual([{ provider: "akongdakong", externalId: "309" }]);
  });
});
