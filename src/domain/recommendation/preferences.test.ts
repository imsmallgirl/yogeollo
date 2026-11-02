import { describe, expect, it } from "vitest";
import { recommendationInputSchema, recommendationPreferencesSchema } from "./preferences";

const selection = { playTime: "BETWEEN_30_60", mood: "STRATEGY", difficulty: "ANY" };

describe("추천 조건 입력", () => {
  it.each(["2", "3", "4", "5", "6"])("%s명 선택을 정확한 인원으로 변환한다", (players) => {
    expect(recommendationInputSchema.parse({ ...selection, players }).playerCount).toBe(Number(players));
  });

  it.each([7, 8, 10, "12"])("7명 이상은 실제 인원 %s명을 보존한다", (exactPlayers) => {
    expect(recommendationInputSchema.parse({ ...selection, players: "7-plus", exactPlayers }).playerCount).toBe(Number(exactPlayers));
  });

  it.each([undefined, null, "", "7명", "7.5", "1e2", " 8 ", 6, 7.5, true, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "잘못된 추가 인원 %s를 거부한다", (exactPlayers) => {
      expect(recommendationInputSchema.safeParse({ ...selection, players: "7-plus", exactPlayers }).success).toBe(false);
    },
  );

  it("작은 인원 선택에 추가 인원을 함께 보내면 모호한 입력으로 거부한다", () => {
    expect(recommendationInputSchema.safeParse({ ...selection, players: "4", exactPlayers: 8 }).success).toBe(false);
  });

  it.each([
    { playerCount: 1 }, { playerCount: 2.5 }, { playerCount: "4" }, { playerCount: NaN },
    { playTime: "anything" }, { mood: "anything" }, { difficulty: "anything" }, { extra: true },
  ])("정규화 조건도 경계에서 검증한다: %j", (override) => {
    expect(recommendationPreferencesSchema.safeParse({ ...selection, playerCount: 4, ...override }).success).toBe(false);
  });
});
