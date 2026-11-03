import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GamePhoto } from "./game-photo";

describe("실제 사진과 출처 표시", () => {
  it("카드와 상세 모두 저작자·출처·라이선스·변경·판본 안내를 함께 표시한다", () => {
    for (const detail of [false, true]) {
      const html = renderToStaticMarkup(createElement(GamePhoto, { slug: "klask", detail }));
      expect(html).toContain('alt="클라스크의 파란 게임판과 자석 말"');
      expect(html).toContain("Achim Raschka");
      expect(html).toContain('href="https://creativecommons.org/licenses/by-sa/4.0/"');
      expect(html).toContain("KLASK_04.jpg");
      expect(html).toContain("내용 편집 없음");
      expect(html).toContain("한국 판매판");
      expect(html).toContain("object-contain");
      expect(html).toContain("/_next/image?");
    }
  });
  it("권한 확인 사진이 없는 게임에는 이미지를 만들지 않는다", () => {
    expect(renderToStaticMarkup(createElement(GamePhoto, { slug: "dobble" }))).toBe("");
  });
});
