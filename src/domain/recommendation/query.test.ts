import { describe, expect, it } from "vitest";
import { defaultPreferences, editRecommendationHref, parseRecommendationQuery, recommendationQuery } from "./query";

describe("공유 URL 조건", () => {
  it.each([2, 4, 7, 8, 12])("%i명 조건을 URL로 왕복해도 선택을 보존한다", (playerCount) => {
    const preferences = { ...defaultPreferences, playerCount };
    expect(parseRecommendationQuery(Object.fromEntries(new URLSearchParams(recommendationQuery(preferences))))).toEqual({ success: true, preferences });
    expect(editRecommendationHref(preferences).endsWith("#find-game")).toBe(true);
  });
  it.each([
    {}, { players: ["2", "4"] }, { playTime: ["UP_TO_15", "AT_LEAST_120"] },
    { players: "7-plus" }, { players: "7-plus", exactPlayers: "6" }, { mood: "unknown" },
    { extra: "arbitrary" }, { players: "4", exactPlayers: "8" },
  ])("잘못된 URL을 추정해 추천하지 않는다: %j", (override) => {
    const base = Object.fromEntries(new URLSearchParams(recommendationQuery(defaultPreferences)));
    const input = Object.keys(override).length ? { ...base, ...override } : {};
    const result = parseRecommendationQuery(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toContain("조건을 확인");
  });
  it("잘못된 원시 값을 오류 메시지에 복제하지 않는다", () => {
    expect(JSON.stringify(parseRecommendationQuery({ players: "<script>private-value</script>" }))).not.toContain("private-value");
  });
});
