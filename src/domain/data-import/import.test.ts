import { describe, expect, it } from "vitest";
import { makeGame, deepFreeze } from "../recommendation/__tests__/fixtures";
import { importPackageSchema, type ImportPackage } from "./schema";
import { planImport } from "./plan";
import { canonicalJson, contentDigest, publicationDigest } from "./digest";

const asOf = "2030-01-01T00:00:00Z";
function input(): ImportPackage {
  return importPackageSchema.parse({ version: 1, revision: 1, label: "테스트 전용", collectedBy: "테스트", collectedAt: "2026-11-02T17:00:00Z", acquisition: { method: "MANUAL_REVIEW", permissionStatus: "CONFIRMED", permissionBasis: "실제 수집이 아닌 합성 테스트" }, games: [makeGame("import-test", { editorial: null })] });
}
const codes = (payload: ImportPackage, existing = [] as ReturnType<typeof makeGame>[]) => planImport(payload, existing, asOf).issues.map((issue) => issue.code);

describe("검토 기반 가져오기", () => {
  it("입력을 변경하지 않고 생성·동일 내용 계획을 결정한다", () => {
    const payload = input(); deepFreeze(payload);
    expect(planImport(payload, [], asOf)).toMatchObject({ issues: [], changes: [{ action: "CREATE", addedSources: 1, addedObservations: 1 }] });
    expect(planImport(payload, payload.games, asOf)).toMatchObject({ issues: [], changes: [{ action: "NOOP", changedFields: [] }] });
  });
  it("DB ISO 날짜 형식 차이는 변경으로 간주하지 않는다", () => {
    const payload = input(); const existing = structuredClone(payload.games);
    existing[0].facts.lastVerifiedAt = new Date(existing[0].facts.lastVerifiedAt!).toISOString();
    existing[0].sources[0].observations[0].verifiedAt = new Date(existing[0].sources[0].verifiedAt).toISOString();
    expect(planImport(payload, existing, asOf).changes[0].action).toBe("NOOP");
  });
  it("권한 미확인 자료는 보관할 수 있지만 승인 대상에서 차단한다", () => {
    const payload = input(); payload.acquisition.permissionStatus = "UNCONFIRMED";
    expect(codes(payload)).toContain("PERMISSION_UNCONFIRMED");
  });
  it.each(["type", "hostname", "provider"])("BGG %s 경로를 차단한다", (kind) => {
    const payload = input();
    if (kind === "type") payload.games[0].sources[0].sourceType = "BGG";
    if (kind === "hostname") payload.games[0].sources[0].sourceUrl = "https://www.boardgamegeek.com/boardgame/1";
    if (kind === "provider") payload.games[0].externalIds = [{ provider: "BoardGameGeek.com", externalId: "1" }];
    expect(codes(payload)).toContain("BGG_DISABLED");
  });
  it("미검증 사실과 미래 수집·관측, 미확인 출처 이용을 차단한다", () => {
    const payload = input(); payload.games[0].facts.verificationStatus = "PENDING";
    payload.collectedAt = "2031-01-01T00:00:00Z";
    payload.games[0].sources[0].observations[0].verifiedAt = "2031-01-01T00:00:00Z";
    payload.games[0].sources[0].observations[0].usageStatus = "UNCONFIRMED";
    expect(codes(payload)).toEqual(expect.arrayContaining(["UNVERIFIED_FACTS", "FUTURE_DATE", "SOURCE_USAGE_UNCONFIRMED"]));
  });
  it("같은 slug의 판본 변경과 다른 slug의 이름 중복을 자동 병합하지 않는다", () => {
    const payload = input(); const old = structuredClone(payload.games[0]); old.facts.editionNote = "다른 판본";
    expect(codes(payload, [old])).toContain("EDITION_CONFLICT");
    old.facts.slug = "other-slug";
    expect(codes(payload, [old])).toContain("IDENTITY_COLLISION");
  });
  it("기존 자체 편집의 권장 인원을 무효화하지 않는다", () => {
    const payload = input(); const old = makeGame("import-test", { editorial: { bestPlayers: [4] } });
    payload.games[0] = makeGame("import-test", { facts: { maxPlayers: 3 }, editorial: null });
    expect(codes(payload, [old])).toContain("EDITORIAL_CONFLICT");
  });
  it("같은 관측 수정·오래된 출처·출처 이름 변경을 차단한다", () => {
    const payload = input(); const old = structuredClone(payload.games[0]);
    payload.games[0].sources[0].observations[0].evidenceNoteKo = "덮어쓰기 시도";
    old.sources[0].verifiedAt = "2026-11-03T00:00:00Z";
    old.sources[0].sourceName = "기존 이름";
    expect(codes(payload, [old])).toEqual(expect.arrayContaining(["OBSERVATION_CONFLICT", "STALE_SOURCE", "SOURCE_IDENTITY_CONFLICT"]));
  });
  it("새 관측을 추가하고 기존 출처를 생략해도 삭제하지 않는 계획이다", () => {
    const payload = input(); const old = structuredClone(payload.games[0]);
    const observation = structuredClone(payload.games[0].sources[0].observations[0]); observation.verifiedAt = "2026-11-03T00:00:00Z";
    payload.games[0].sources[0].observations.push(observation);
    payload.games[0].sources[0].verifiedAt = observation.verifiedAt;
    expect(planImport(payload, [old], asOf)).toMatchObject({ issues: [], changes: [{ action: "UPDATE", addedObservations: 1 }] });
  });
  it("제공자 대소문자를 고려해 ID 교체와 다른 게임의 ID 재사용을 차단한다", () => {
    const payload = input(); payload.games[0].externalIds = [{ provider: "TEST", externalId: "new" }];
    const old = structuredClone(payload.games[0]); old.externalIds = [{ provider: "test", externalId: "old" }];
    const other = makeGame("different", { editorial: null }); other.externalIds = [{ provider: "test", externalId: "new" }];
    expect(codes(payload, [old, other]).filter((code) => code === "EXTERNAL_ID_CONFLICT")).toHaveLength(2);
  });
  it("자체 편집·알 수 없는 필드·인증 URL·중복 slug·빈 배열을 거부한다", () => {
    const payload = input();
    expect(importPackageSchema.safeParse({ ...payload, games: [makeGame("import-test")] }).success).toBe(false);
    expect(importPackageSchema.safeParse({ ...payload, secret: "no" }).success).toBe(false);
    expect(importPackageSchema.safeParse({ ...payload, games: [] }).success).toBe(false);
    expect(importPackageSchema.safeParse({ ...payload, games: [...payload.games, ...payload.games] }).success).toBe(false);
    payload.games[0].sources[0].sourceUrl = "https://user:password@example.invalid/source";
    expect(importPackageSchema.safeParse(payload).success).toBe(false);
  });
  it("제공자 표기 차이를 이용한 중복 ID를 거부한다", () => {
    const payload = input(); payload.games[0].externalIds = [{ provider: "test", externalId: "a" }, { provider: "TEST", externalId: "b" }];
    expect(importPackageSchema.safeParse(payload).success).toBe(false);
  });
  it("DB가 조용히 반올림할 날짜 정밀도를 거부한다", () => {
    const payload = input(); payload.games[0].sources[0].observations[0].verifiedAt = "2026-11-02T16:54:27.1234Z";
    expect(importPackageSchema.safeParse(payload).success).toBe(false);
  });
});

describe("내용 해시", () => {
  it("JSON 키 순서·공백과 무관하고 실제 내용 변경에는 달라진다", () => {
    expect(contentDigest({ a: 1, b: { x: true, y: null } })).toBe(contentDigest({ b: { y: null, x: true }, a: 1 }));
    expect(contentDigest({ a: 1 })).not.toBe(contentDigest({ a: 2 }));
    expect(() => canonicalJson(undefined)).toThrow();
    expect(() => canonicalJson(Number.NaN)).toThrow();
  });
  it("공개 해시는 DB 날짜 포맷·출처 정렬 차이를 정규화한다", () => {
    const record = makeGame("digest"); const copy = structuredClone(record);
    copy.facts.lastVerifiedAt = new Date(copy.facts.lastVerifiedAt!).toISOString();
    copy.sources[0].observations[0].checkedFields.reverse();
    expect(publicationDigest(copy)).toBe(publicationDigest(record));
    copy.sources[0].observations[0].evidenceNoteKo = "changed";
    expect(publicationDigest(copy)).not.toBe(publicationDigest(record));
  });
  it("미검토 자체 편집은 공개 해시에 포함하지 않고 검증 편집 변경은 감지한다", () => {
    const record = makeGame("digest"); const copy = structuredClone(record);
    copy.editorial!.verificationStatus = "PENDING";
    const pending = publicationDigest(copy); copy.editorial!.descriptionKo = "미검토 수정";
    expect(publicationDigest(copy)).toBe(pending);
    expect(publicationDigest({ ...copy, editorial: null })).toBe(pending);
    expect(publicationDigest(record)).not.toBe(pending);
  });
});
