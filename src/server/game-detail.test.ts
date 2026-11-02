import { describe, expect, it, vi } from "vitest";
import splendor from "../../data/games/splendor.json";
import { recommendationGameSchema } from "../domain/recommendation/types";
import type { RecommendationCatalog } from "./catalog";
vi.mock("server-only", () => ({}));
vi.mock("./games", () => ({ listVerifiedBoardGames: vi.fn() }));
import { getGameDetail } from "./game-detail";

describe("상세 공개 경계", () => {
  it("개발 미리보기에는 별도의 자체 작성 초안만 연결한다", async () => {
    const load = vi.fn<() => Promise<RecommendationCatalog>>().mockResolvedValue({ status: "ready", preview: true, games: [recommendationGameSchema.parse(splendor)] });
    const result = await getGameDetail("splendor", load);
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.guide?.status).toBe("DRAFT");
      expect(result.editorial).toBeNull();
      expect(result.game.editorial?.verificationStatus).toBe("PENDING");
    }
  });
  it("운영 카탈로그에 게임이 있어도 개발용 초안을 반환하지 않는다", async () => {
    const load = vi.fn<() => Promise<RecommendationCatalog>>().mockResolvedValue({ status: "ready", preview: false, games: [recommendationGameSchema.parse(splendor)] });
    const result = await getGameDetail("splendor", load);
    expect(result.status).toBe("found");
    if (result.status === "found") expect(result.guide).toBeNull();
  });
  it("공개 검토가 없는 게임과 존재하지 않는 게임은 찾을 수 없다", async () => {
    for (const catalog of [{ status: "pending" }, { status: "ready", preview: true, games: [] }] satisfies RecommendationCatalog[]) {
      expect(await getGameDetail("splendor", async () => catalog)).toEqual({ status: "not-found" });
    }
  });
  it("잘못된 slug는 조회 전에 거부한다", async () => {
    const load = vi.fn();
    expect(await getGameDetail("../../private", load)).toEqual({ status: "not-found" });
    expect(load).not.toHaveBeenCalled();
  });
  it("자료 조회 실패를 존재하지 않는 게임으로 숨기지 않는다", async () => {
    expect(await getGameDetail("splendor", async () => ({ status: "unavailable" }))).toEqual({ status: "unavailable" });
  });
});
