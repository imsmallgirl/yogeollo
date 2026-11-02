import { describe, expect, it, vi } from "vitest";
import { chooseRouletteIndex, rouletteCandidatesSchema, rouletteEndRotation, selectedRouletteCandidates } from "./roulette";

describe("룰렛 선택과 위치", () => {
  it("빈 선택과 범위 밖 후보 수는 선택하지 않는다", () => {
    for (const count of [0, -1, 1.5, 6]) expect(() => chooseRouletteIndex(count, () => 0)).toThrow();
  });
  it("한 후보는 난수 없이 바로 선택한다", () => {
    const source = vi.fn();
    expect(chooseRouletteIndex(1, source)).toBe(0);
    expect(source).not.toHaveBeenCalled();
  });
  it.each([2, 3, 4, 5])("%i개 후보의 각 구간을 선택할 수 있다", (count) => {
    expect(Array.from({ length: count }, (_, value) => chooseRouletteIndex(count, () => value))).toEqual(Array.from({ length: count }, (_, value) => value));
  });
  it("나머지 편향을 일으키는 uint32 끝 값을 버리고 다시 뽑는다", () => {
    const source = vi.fn().mockReturnValueOnce(2 ** 32 - 1).mockReturnValueOnce(1);
    expect(chooseRouletteIndex(3, source)).toBe(1);
    expect(source).toHaveBeenCalledTimes(2);
  });
  it.each([-1, 0.5, 2 ** 32, NaN])("잘못된 난수 %s는 결과로 대체하지 않는다", (value) => {
    expect(() => chooseRouletteIndex(2, () => value)).toThrow();
  });
  it("고장 난 난수원이 무한 반복을 만들지 않는다", () => {
    expect(() => chooseRouletteIndex(3, () => 2 ** 32 - 1)).toThrow();
  });
  it("추천에 없는 slug나 중복 선택으로 후보를 늘리지 않는다", () => {
    const candidates = [{ slug: "test-one", nameKo: "테스트 하나" }, { slug: "test-two", nameKo: "테스트 둘" }];
    expect(selectedRouletteCandidates(candidates, ["test-two", "test-two", "unknown"])).toEqual([candidates[1]]);
    expect(rouletteCandidatesSchema.safeParse([candidates[0], candidates[0]]).success).toBe(false);
  });
  it.each([2, 3, 4, 5])("%i개 후보에서 회전 후 고정 포인터가 실제 선택 구간의 중앙을 가리킨다", (count) => {
    for (const current of [0, 1888, 3901.5]) for (let index = 0; index < count; index++) {
      const end = rouletteEndRotation(current, index, count);
      expect(end).toBeGreaterThanOrEqual(current + 360 * 5);
      const pointerAngle = (end + (index + 0.5) * 360 / count) % 360;
      expect(Math.min(pointerAngle, 360 - pointerAngle)).toBeCloseTo(0, 8);
    }
  });
});
