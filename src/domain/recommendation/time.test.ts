import { describe, expect, it } from "vitest";
import { classifyPlayTime, explainTimeRelaxation } from "./time";
import type { PlayTime } from "./preferences";
import type { TimeMatch } from "./types";

describe("시간 범위", () => {
  const cases: Array<[number, number, PlayTime, TimeMatch | null]> = [
    [15, 15, "UP_TO_15", "STRICT"],
    [15, 15, "BETWEEN_15_30", "STRICT"],
    [30, 30, "BETWEEN_15_30", "STRICT"],
    [30, 30, "BETWEEN_30_60", "STRICT"],
    [60, 60, "BETWEEN_30_60", "STRICT"],
    [60, 60, "BETWEEN_60_120", "STRICT"],
    [120, 120, "BETWEEN_60_120", "STRICT"],
    [120, 120, "AT_LEAST_120", "STRICT"],
    [180, 600, "AT_LEAST_120", "STRICT"],
    [30, 60, "BETWEEN_30_60", "STRICT"],
    [45, 90, "BETWEEN_30_60", "OVERLAPPING_TIME"],
    [20, 40, "BETWEEN_30_60", "OVERLAPPING_TIME"],
    [10, 30, "UP_TO_15", "OVERLAPPING_TIME"],
    [60, 120, "AT_LEAST_120", "OVERLAPPING_TIME"],
    [20, 25, "BETWEEN_30_60", "ADJACENT_TIME"],
    [90, 100, "BETWEEN_30_60", "ADJACENT_TIME"],
    [120, 120, "BETWEEN_30_60", "ADJACENT_TIME"],
    [1, 600, "BETWEEN_30_60", null],
    [10, 31, "UP_TO_15", null],
    [1, 15, "BETWEEN_30_60", null],
    [121, 180, "BETWEEN_30_60", null],
    [15, 30, "AT_LEAST_120", null],
  ];
  it.each(cases)("%i~%i분 / %s → %s", (min, max, requested, expected) => {
    expect(classifyPlayTime(min, max, requested)).toBe(expected);
  });

  it("엄격 일치에는 완화를 표시하지 않는다", () => {
    expect(explainTimeRelaxation(30, 30, "BETWEEN_30_60", "STRICT")).toBeNull();
  });

  it("넘어서는 방향과 실제 표기 범위를 설명한다", () => {
    const longer = explainTimeRelaxation(45, 90, "BETWEEN_30_60", "OVERLAPPING_TIME");
    expect(longer?.message).toContain("45~90분");
    expect(longer?.message).toContain("오래 걸릴 수 있어요");
    const shorter = explainTimeRelaxation(20, 25, "BETWEEN_30_60", "ADJACENT_TIME");
    expect(shorter?.message).toContain("짧게 끝날 수 있어요");
    const both = explainTimeRelaxation(5, 45, "BETWEEN_15_30", "OVERLAPPING_TIME");
    expect(both?.message).toContain("짧게 끝날 수 있어요");
    expect(both?.message).toContain("오래 걸릴 수 있어요");
  });
});
