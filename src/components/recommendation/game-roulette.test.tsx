// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameRoulette } from "./game-roulette";
import type { RouletteCandidate } from "../../domain/roulette/roulette";

const candidates: RouletteCandidate[] = [
  { slug: "test-one", nameKo: "테스트 후보 하나" },
  { slug: "test-two", nameKo: "테스트 후보 둘" },
  { slug: "test-three", nameKo: "테스트 후보 셋" },
];
let container: HTMLDivElement;
let root: Root;
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn<(event: string, callback: () => void) => void>>; removeEventListener: ReturnType<typeof vi.fn> };
let random: ReturnType<typeof vi.fn<(values: Uint32Array) => Uint32Array>>;
const testGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

beforeEach(() => {
  testGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  random = vi.fn((values: Uint32Array) => { values[0] = 1; return values; });
  vi.stubGlobal("crypto", { getRandomValues: random });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete testGlobal.IS_REACT_ACT_ENVIRONMENT;
});

async function render(items: RouletteCandidate[] = candidates) {
  await act(() => root.render(<GameRoulette candidates={items} />));
}
function button() { return container.querySelector<HTMLButtonElement>("button")!; }
function checkbox(slug: string) { return container.querySelector<HTMLInputElement>(`input[value="${slug}"]`)!; }
function message() { return container.querySelector('[role="status"]')?.textContent ?? ""; }

describe("룰렛 상호작용", () => {
  it("다중 후보를 실제로 선택하고 회전 완료 후 그 후보만 알린다", async () => {
    await render();
    await act(() => button().click());
    expect(button().disabled).toBe(true);
    expect(message()).toContain("고르고 있어요");
    await act(() => { vi.advanceTimersByTime(2800); });
    expect(message()).toContain("오늘은 테스트 후보 둘!");
    expect(container.querySelector('a')?.getAttribute("href")).toBe("/games/test-two");
    expect(button().disabled).toBe(false);
  });
  it("같은 이벤트 구간의 중복 실행을 잠그고 회전 중 선택 변경도 막는다", async () => {
    await render();
    await act(() => { button().click(); button().click(); });
    expect(random).toHaveBeenCalledTimes(1);
    expect(checkbox("test-one").matches(":disabled")).toBe(true);
    await act(() => checkbox("test-one").click());
    expect(checkbox("test-one").checked).toBe(true);
  });
  it("선택 해제한 후보가 결과에 다시 들어가지 않는다", async () => {
    await render();
    await act(() => checkbox("test-one").click());
    await act(() => button().click());
    await act(() => { vi.advanceTimersByTime(2800); });
    expect(message()).toContain("오늘은 테스트 후보 셋!");
  });
  it("바퀴의 회전 완료 이벤트에서 결과를 공개하고 이후 타이머는 결과를 바꾸지 않는다", async () => {
    await render();
    await act(() => button().click());
    const wheel = container.querySelector('[data-testid="roulette-wheel"]')!;
    const event = new Event("transitionend", { bubbles: true });
    Object.defineProperty(event, "propertyName", { value: "transform" });
    await act(() => { wheel.dispatchEvent(event); });
    expect(message()).toContain("오늘은 테스트 후보 둘!");
    await act(() => { vi.advanceTimersByTime(3000); });
    expect(message()).toContain("오늘은 테스트 후보 둘!");
    expect(random).toHaveBeenCalledTimes(1);
  });
  it("빈 선택은 실행할 수 없고 한 후보는 난수나 회전 없이 바로 정한다", async () => {
    await render([candidates[0]]);
    await act(() => checkbox("test-one").click());
    expect(button().disabled).toBe(true);
    expect(message()).toContain("후보를 1개 이상");
    await act(() => checkbox("test-one").click());
    await act(() => button().click());
    expect(message()).toContain("오늘은 테스트 후보 하나!");
    expect(random).not.toHaveBeenCalled();
  });
  it("동작 줄이기 설정이면 다중 후보도 회전 없이 결과를 보여준다", async () => {
    media.matches = true;
    await render();
    await act(() => button().click());
    expect(message()).toContain("오늘은 테스트 후보 둘!");
    expect(container.querySelector<HTMLElement>('[data-testid="roulette-wheel"]')?.style.transition).toBe("none");
    expect(button().disabled).toBe(false);
  });
  it("회전 도중 동작 줄이기를 켜면 선택을 바꾸지 않고 즉시 끝낸다", async () => {
    await render();
    await act(() => button().click());
    media.matches = true;
    await act(() => media.addEventListener.mock.calls[0][1]());
    expect(message()).toContain("오늘은 테스트 후보 둘!");
    expect(random).toHaveBeenCalledTimes(1);
  });
  it("선택을 바꾸면 이전 결과를 지우고 후보 목록 교체 시 상태를 초기화한다", async () => {
    media.matches = true;
    await render();
    await act(() => button().click());
    await act(() => checkbox("test-one").click());
    expect(message()).not.toContain("오늘은");
    await render([candidates[0]]);
    expect(checkbox("test-one").checked).toBe(true);
    expect(message()).not.toContain("오늘은");
  });
  it("난수 API 실패 시 임의 결과를 대신 표시하지 않는다", async () => {
    random.mockImplementation(() => { throw new Error("test-only-rng-failure"); });
    await render();
    await act(() => button().click());
    expect(message()).toContain("고르지 못했어요");
    expect(message()).not.toContain("오늘은");
    expect(button().disabled).toBe(false);
  });
});
