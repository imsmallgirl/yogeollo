import { describe, expect, it } from "vitest";
import { parseDatabaseUrl } from "./database-env";

describe("서버 DB 주소 검증", () => {
  it("PostgreSQL 데이터베이스 주소만 허용한다", () => {
    expect(parseDatabaseUrl("postgresql://localhost/yogeollo")).toBe("postgresql://localhost/yogeollo");
    expect(parseDatabaseUrl("postgres://localhost/yogeollo")).toBe("postgres://localhost/yogeollo");
    for (const input of [undefined, "", "https://example.com/db", "postgresql://localhost/"]) {
      expect(() => parseDatabaseUrl(input)).toThrow("DATABASE_URL");
    }
  });

  it("오류에 연결 정보나 비밀값을 노출하지 않는다", () => {
    const secret = "https://user:private-secret@example.com/db";
    expect(() => parseDatabaseUrl(secret)).toThrow("DATABASE_URL");
    try {
      parseDatabaseUrl(secret);
    } catch (error) {
      expect(String(error)).not.toContain("private-secret");
    }
  });
});
