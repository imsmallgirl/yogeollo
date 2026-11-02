import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function run(file: string) {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/data-import.ts", "check", "--file", file], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "deliberately-invalid", DIRECT_URL: "" } });
}
describe("오프라인 데이터 검사 CLI", () => {
  it("실제 예제는 DB 연결 없이 검사하되 권한 미확인으로 종료 코드 2를 반환한다", () => {
    const result = run("data/imports/splendor-unreviewed.json");
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ valid: true, databaseCompared: false, eligibleForReview: false, recordCount: 1, issues: [{ code: "PERMISSION_UNCONFIRMED" }] });
    expect(result.stdout + result.stderr).not.toContain("deliberately-invalid");
  });
  it("잘못된 JSON·과대 파일의 내용이나 연결 정보를 출력하지 않는다", async () => {
    const directory = await mkdtemp(join(tmpdir(), "yogeollo-import-"));
    try {
      const file = join(directory, "input.json");
      await writeFile(file, '{"private-secret":');
      const malformed = run(file); expect(malformed.status).toBe(1);
      expect(malformed.stdout + malformed.stderr).not.toContain("private-secret");
      await writeFile(file, "x".repeat(2 * 1024 * 1024 + 1));
      const large = run(file); expect(large.status).toBe(1);
      expect(JSON.parse(large.stdout).code).toBe("FILE_TOO_LARGE");
    } finally { await rm(directory, { recursive: true }); }
  });
});
