import { describe, expect, it } from "vitest";
import splendor from "../../../data/games/splendor.json";
import { boardGameRecordSchema, gameDatasetSchema } from "./schema";

describe("게임 데이터 검증", () => {
  it("출처를 대조한 소량 샘플과 미확인 값을 그대로 유지한다", () => {
    const record = boardGameRecordSchema.parse(splendor);
    expect(record.facts.averagePlayTime).toBeNull();
    expect(record.facts.domesticAvailability).toBe("LISTED");
    expect(record.facts.domesticPopularityStatus).toBe("UNKNOWN");
    expect(record.editorial?.verificationStatus).toBe("PENDING");
    expect(record.editorial?.bestPlayers).toEqual([]);
  });

  it.each([
    { minPlayers: 0 }, { maxPlayers: 1 }, { minPlayTime: 0 }, { maxPlayTime: 20 },
    { averagePlayTime: 45 }, { complexity: 2 }, { lastVerifiedAt: null }, { minPlayers: 2.5 },
  ])("불가능한 사실 범위를 거부한다: %j", (override) => {
    expect(boardGameRecordSchema.safeParse({ ...splendor, facts: { ...splendor.facts, ...override } }).success).toBe(false);
  });

  it("필수 필드 누락을 추정값으로 채우지 않는다", () => {
    const input = structuredClone(splendor);
    const { minPlayers: omitted, ...facts } = input.facts;
    expect(omitted).toBe(2);
    expect(boardGameRecordSchema.safeParse({ ...input, facts }).success).toBe(false);
  });

  it("추천 인원 범위 위반과 중복을 거부한다", () => {
    for (const bestPlayers of [[5], [2, 2]]) {
      expect(boardGameRecordSchema.safeParse({ ...splendor, editorial: { ...splendor.editorial, bestPlayers } }).success).toBe(false);
    }
  });

  it("외부 출처 없는 VERIFIED 상태를 거부한다", () => {
    expect(boardGameRecordSchema.safeParse({ ...splendor, sources: [] }).success).toBe(false);
  });

  it("상품 노출만으로 재고·인기·한국어판 확인을 추가할 수 없다", () => {
    for (const override of [{ domesticPopularityStatus: "CONFIRMED" }, { koreanEdition: "CONFIRMED" }, { domesticAvailability: "IN_STOCK" }]) {
      expect(boardGameRecordSchema.safeParse({ ...splendor, facts: { ...splendor.facts, ...override } }).success).toBe(false);
    }
  });

  it("이용 근거가 미확인인 출처는 검증 근거로 사용하지 않는다", () => {
    const input = structuredClone(splendor);
    input.sources[0].observations[0].usageStatus = "UNCONFIRMED";
    expect(boardGameRecordSchema.safeParse(input).success).toBe(false);
  });

  it("중복 출처와 서로 다른 확인일을 거부한다", () => {
    expect(boardGameRecordSchema.safeParse({ ...splendor, sources: [...splendor.sources, splendor.sources[0]] }).success).toBe(false);
    const input = structuredClone(splendor);
    input.sources[0].verifiedAt = "2026-10-01T00:00:00Z";
    expect(boardGameRecordSchema.safeParse(input).success).toBe(false);
  });

  it("중복 slug와 게임 사이 외부 ID 중복을 거부한다", () => {
    expect(gameDatasetSchema.safeParse([splendor, splendor]).success).toBe(false);
    const externalIds = [{ provider: "test-fixture", externalId: "same" }];
    const first = { ...splendor, externalIds };
    const second = { ...splendor, facts: { ...splendor.facts, slug: "test-fixture" }, externalIds };
    expect(gameDatasetSchema.safeParse([first, second]).success).toBe(false);
  });

  it("편집 초안을 검증 완료로 바꾸려면 검토 날짜가 필요하다", () => {
    expect(boardGameRecordSchema.safeParse({ ...splendor, editorial: { ...splendor.editorial, verificationStatus: "VERIFIED" } }).success).toBe(false);
  });
});
