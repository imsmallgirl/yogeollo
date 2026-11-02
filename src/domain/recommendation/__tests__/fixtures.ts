import { boardGameRecordSchema, type BoardGameRecord } from "../../games/schema";

type Editorial = NonNullable<BoardGameRecord["editorial"]>;
interface FixtureOptions {
  facts?: Partial<BoardGameRecord["facts"]>;
  editorial?: Partial<Editorial> | null;
  id?: string;
}

/** Synthetic test records only. Never import these fixtures in production/seed code. */
export function makeGame(slug: string, options: FixtureOptions = {}) {
  const checkedAt = "2026-11-02T16:54:27Z";
  const facts: BoardGameRecord["facts"] = {
    slug,
    nameKo: `테스트 전용 ${slug}`,
    nameEn: null,
    editionNote: "추천 엔진 테스트 전용 합성 자료이며 실제 게임이 아닙니다.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlayTime: 30,
    maxPlayTime: 30,
    averagePlayTime: null,
    complexity: null,
    complexityScale: null,
    koreanEdition: "CONFIRMED",
    domesticAvailability: "IN_STOCK",
    domesticPlayStatus: "UNKNOWN",
    domesticPopularityStatus: "UNKNOWN",
    verificationStatus: "VERIFIED",
    lastVerifiedAt: checkedAt,
    ...options.facts,
  };
  const editorial: Editorial | null = options.editorial === null ? null : {
    bestPlayers: [facts.minPlayers],
    categories: ["테스트 장르"],
    mechanics: ["테스트 메커니즘"],
    moodTags: ["STRATEGY"],
    difficulty: "EASY",
    languageDependency: "LOW",
    descriptionKo: "실제 게임으로 공개하지 않는 테스트 전용 소개입니다.",
    setupKo: null,
    howToPlayKo: null,
    victoryKo: null,
    recommendedForKo: null,
    cautionsKo: null,
    rationaleKo: "실제 관측·인기를 주장하지 않는 알고리즘 검증용 데이터입니다.",
    author: "단위 테스트 픽스처",
    verificationStatus: "VERIFIED",
    reviewedAt: checkedAt,
    ...options.editorial,
  };
  const {
    slug: omittedSlug, verificationStatus: omittedStatus, lastVerifiedAt: omittedDate, ...observedFacts
  } = facts;
  // Explicitly consume metadata omitted from the field-value snapshot.
  void omittedSlug;
  void omittedStatus;
  void omittedDate;
  const record = boardGameRecordSchema.parse({
    facts,
    editorial,
    sources: [{
      sourceName: "테스트 전용 합성 출처",
      sourceUrl: `https://fixtures.example.invalid/${slug}`,
      sourceType: "PUBLIC_DATA",
      verifiedAt: checkedAt,
      observations: [{
        verifiedAt: checkedAt,
        verificationStatus: "VERIFIED",
        checkedFields: Object.keys(observedFacts),
        observedFacts,
        collectionMethod: "MANUAL_REVIEW",
        reviewedBy: "테스트 픽스처",
        evidenceNoteKo: "실제 출처가 아닌 테스트 전용 관측입니다.",
        usageStatus: "FACTS_ONLY",
        usageNoteKo: "테스트 코드 내부에서만 사용합니다.",
      }],
    }],
    externalIds: [],
  });
  return { ...record, ...(options.id ? { id: options.id } : {}) };
}

export function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach((child: unknown) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}
