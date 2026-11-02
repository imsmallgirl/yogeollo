import { describe, expect, it } from "vitest";
import { parseSiteUrl } from "./env";
describe("공개 사이트 주소", () => { it("로컬 기본 주소를 사용한다", () => { expect(parseSiteUrl(undefined)).toBe("http://localhost:3000"); }); it("잘못된 주소와 비웹 프로토콜을 거부한다", () => { expect(() => parseSiteUrl("invalid")).toThrow(); expect(() => parseSiteUrl("javascript:alert(1)")).toThrow(); }); });
