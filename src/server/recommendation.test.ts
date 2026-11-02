import { describe, expect, it, vi } from "vitest";
import splendor from "../../data/games/splendor.json";
import { defaultPreferences, recommendationQuery } from "../domain/recommendation/query";
import { recommendationGameSchema } from "../domain/recommendation/types";
import type { RecommendationCatalog } from "./catalog";
vi.mock("server-only", () => ({}));
vi.mock("./games", () => ({ listVerifiedBoardGames: vi.fn() }));
import { getRecommendationPageData } from "./recommendation";

const query = Object.fromEntries(new URLSearchParams(recommendationQuery(defaultPreferences)));

describe("추천 화면 서버 흐름", () => {
  it("조건 검증에 실패하면 데이터 조회를 시작하지 않는다", async () => {
    const load = vi.fn();
    expect((await getRecommendationPageData({ ...query, players: ["2", "4"] }, load)).status).toBe("invalid");
    expect(load).not.toHaveBeenCalled();
  });
  it("검증된 사실을 기존 엔진에 전달하고 미확인 난이도를 유지한다", async () => {
    const load = vi.fn<() => Promise<RecommendationCatalog>>().mockResolvedValue({ status: "ready", preview: true, games: [recommendationGameSchema.parse(splendor)] });
    const result = await getRecommendationPageData(query, load);
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.result.recommendations).toHaveLength(1);
      expect(result.result.recommendations[0].game.difficulty).toBeNull();
      expect(result.catalogSize).toBe(1);
    }
  });
  it.each(["pending", "unavailable"] as const)("%s와 조건에 맞는 결과 없음을 구분한다", async (status) => {
    const load = vi.fn<() => Promise<RecommendationCatalog>>().mockResolvedValue({ status });
    const result = await getRecommendationPageData(query, load);
    expect(result).toEqual({ status, preferences: defaultPreferences });
  });
});
