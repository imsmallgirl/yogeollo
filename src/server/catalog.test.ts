import { describe, expect, it, vi } from "vitest";
import splendor from "../../data/games/splendor.json";
vi.mock("server-only", () => ({}));
vi.mock("./games", () => ({ listVerifiedBoardGames: vi.fn() }));
import { catalogMode, loadRecommendationCatalog } from "./catalog";

const testApproval = { approvedGames: [{ slug: "splendor", reviewedBy: "테스트 전용 승인", approvedAt: "2026-11-02T16:54:27Z", usageBasis: "테스트 함수 내부에서만 사용" }] };

describe("추천 데이터 공개 경계", () => {
  it("개발 환경 기본값만 기존 샘플 미리보기로 연결한다", async () => {
    const listGames = vi.fn();
    const result = await loadRecommendationCatalog({ environment: { NODE_ENV: "development" }, listGames });
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.preview).toBe(true);
      expect(result.games).toHaveLength(1);
      expect(result.games[0].editorial?.verificationStatus).toBe("PENDING");
    }
    expect(listGames).not.toHaveBeenCalled();
  });
  it.each(["production", undefined])("%s에서는 preview 환경변수로도 미검토 샘플을 공개할 수 없다", async (NODE_ENV) => {
    const listGames = vi.fn();
    expect(await loadRecommendationCatalog({ environment: { NODE_ENV, GAME_DATA_MODE: "preview" }, listGames })).toEqual({ status: "pending" });
    expect(listGames).not.toHaveBeenCalled();
  });
  it("현재 운영 승인 목록이 비어 있으면 DB에 접근하지 않는다", async () => {
    const listGames = vi.fn();
    expect(await loadRecommendationCatalog({ environment: { NODE_ENV: "production" }, listGames })).toEqual({ status: "pending" });
    expect(listGames).not.toHaveBeenCalled();
  });
  it("운영 조회는 명시적으로 공개 검토한 slug와 VERIFIED 사실만 통과한다", async () => {
    const unapproved = { ...splendor, facts: { ...splendor.facts, slug: "unapproved-test" } };
    const result = await loadRecommendationCatalog({ environment: { NODE_ENV: "production" }, approvals: testApproval, listGames: async () => [splendor, unapproved, {}] });
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.preview).toBe(false);
      expect(result.games.map((game) => game.facts.slug)).toEqual(["splendor"]);
    }
  });
  it("DB 실패 시 샘플로 바꾸거나 원시 오류를 페이지에 보내지 않는다", async () => {
    const result = await loadRecommendationCatalog({ environment: { NODE_ENV: "production" }, approvals: testApproval, listGames: async () => { throw new Error("password=private-secret"); } });
    expect(result).toEqual({ status: "unavailable" });
    expect(JSON.stringify(result)).not.toContain("private-secret");
  });
  it.each([{ approvedGames: [{ slug: "splendor" }] }, { approvedGames: [...testApproval.approvedGames, ...testApproval.approvedGames] }])("불완전하거나 중복된 공개 검토 기록은 사용하지 않는다", async (approvals) => {
    const listGames = vi.fn();
    expect(await loadRecommendationCatalog({ environment: { NODE_ENV: "production" }, approvals, listGames })).toEqual({ status: "unavailable" });
    expect(listGames).not.toHaveBeenCalled();
  });
  it("알 수 없는 모드는 미리보기로 되돌리지 않는다", () => {
    expect(catalogMode({ NODE_ENV: "development", GAME_DATA_MODE: "invalid" })).toBe("invalid");
  });
  it("승인 게임이 DB에 없거나 검증 만료이면 준비 중 상태다", async () => {
    expect(await loadRecommendationCatalog({ environment: { NODE_ENV: "production" }, approvals: testApproval, listGames: async () => [{ ...splendor, facts: { ...splendor.facts, verificationStatus: "STALE" } }] })).toEqual({ status: "pending" });
  });
});
