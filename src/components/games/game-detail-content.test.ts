import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import splendor from "../../../data/games/splendor.json";
import draft from "../../../data/guides/splendor.json";
import { gameGuideSchema } from "../../domain/games/guide";
import { recommendationGameSchema } from "../../domain/recommendation/types";
import { GameDetailContent } from "./game-detail-content";

describe("상세 콘텐츠", () => {
  it("자체 작성 요약과 필수 항목·출처·한계를 함께 표시한다", () => {
    const html = renderToStaticMarkup(createElement(GameDetailContent, { game: recommendationGameSchema.parse(splendor), editorial: null, guide: gameGuideSchema.parse(draft), preview: true }));
    for (const title of ["준비 방법", "기본 진행 방법", "승리 조건", "추천 대상", "주의할 점", "출처와 작성 정보"]) expect(html).toContain(title);
    expect(html).toContain("15점");
    expect(html).toContain("같은 횟수");
    expect(html).toContain("아직 확인 중");
    expect(html).toContain("자체 작성 요약 초안");
    expect(html).toContain("2026. 11. 3.");
  });
  it("요약이 미확인인 운영 데이터에서 설명을 만들어 채우지 않는다", () => {
    const html = renderToStaticMarkup(createElement(GameDetailContent, { game: recommendationGameSchema.parse(splendor), editorial: null, guide: null, preview: false }));
    expect(html).toContain("설명을 확인하고 있어요");
    expect(html).not.toContain("15점");
    expect(html).not.toContain("자체 작성 요약 초안");
  });
});
