import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import splendor from "../../../data/games/splendor.json";
import { defaultPreferences } from "../../domain/recommendation/query";
import { recommend } from "../../domain/recommendation/recommend";
import { makeGame } from "../../domain/recommendation/__tests__/fixtures";
import { GameCard } from "./game-card";

describe("추천 카드 정보 표시", () => {
  it("평균을 만들지 않고 실제 샘플의 미확인 항목을 그대로 표시한다", () => {
    const recommendation = recommend([splendor], defaultPreferences).recommendations[0];
    const html = renderToStaticMarkup(createElement(GameCard, { recommendation, rank: 1 }));
    expect(html).toContain("스플렌더");
    expect(html).toContain("표기 시간");
    expect(html).not.toContain("평균 시간");
    expect(html).toContain("아직 확인 중");
    expect(html).toContain("게임 자세히 보기");
    expect(html).toContain('href="/games/splendor"');
  });
  it("시간 완화와 실제 범위를 접힌 영역 밖에서 바로 알린다", () => {
    const recommendation = recommend([makeGame("test-only-long", { facts: { minPlayTime: 45, maxPlayTime: 90 } })], defaultPreferences).recommendations[0];
    const html = renderToStaticMarkup(createElement(GameCard, { recommendation, rank: 1 }));
    expect(html).toContain("시간 조건을 완화한 게임이에요");
    expect(html).toContain("45~90분");
    expect(html.indexOf("시간 조건을 완화한 게임이에요")).toBeLessThan(html.indexOf("<details"));
  });
});
