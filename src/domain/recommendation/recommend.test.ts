import { describe, expect, it } from "vitest";
import splendor from "../../../data/games/splendor.json";
import { makeGame, deepFreeze } from "./__tests__/fixtures";
import { recommend } from "./recommend";
import type { RecommendationPreferences } from "./preferences";

const preferences: RecommendationPreferences = {
  playerCount: 2, playTime: "BETWEEN_30_60", mood: "STRATEGY", difficulty: "EASY",
};

const slugs = (result: ReturnType<typeof recommend>) => result.recommendations.map((item) => item.game.slug);

describe("필수 조건과 결과 수", () => {
  it("2인 모임에 2인 플레이가 가능한 게임만 추천한다", () => {
    const two = makeGame("test-two", { facts: { maxPlayers: 2 } });
    const three = makeGame("test-three", { facts: { minPlayers: 3 } });
    const result = recommend([three, two], preferences);
    expect(slugs(result)).toEqual(["test-two"]);
    expect(result.diagnostics).toContainEqual({ inputIndex: 0, slug: "test-three", code: "PLAYER_COUNT_MISMATCH" });
  });

  it("4인 모임에서 최소·최대 인원을 확인한다", () => {
    const games = [
      makeGame("test-two", { facts: { maxPlayers: 2 } }),
      makeGame("test-four", { editorial: { bestPlayers: [4] } }),
      makeGame("test-five", { facts: { minPlayers: 5, maxPlayers: 6 } }),
    ];
    expect(slugs(recommend(games, { ...preferences, playerCount: 4 }))).toEqual(["test-four"]);
  });

  it.each([7, 8, 10])("%i명의 정확한 인원수를 사용한다", (playerCount) => {
    const games = [
      makeGame("test-large", { facts: { minPlayers: 7, maxPlayers: 10 } }),
      makeGame("test-six", { facts: { maxPlayers: 6 } }),
    ];
    expect(slugs(recommend(games, { ...preferences, playerCount }))).toEqual(["test-large"]);
  });

  it("8명을 7명으로 간주하지 않고 인원을 완화하지 않는다", () => {
    const game = makeGame("test-seven", { facts: { minPlayers: 7, maxPlayers: 7 } });
    const result = recommend([game], { ...preferences, playerCount: 8 });
    expect(result.recommendations).toEqual([]);
    expect(result.relaxations).toEqual([]);
    expect(result.notices[0]).toContain("찾지 못했어요");
  });

  it.each(["PENDING", "STALE", "REJECTED"] as const)("%s 사실을 추천하지 않는다", (verificationStatus) => {
    const game = makeGame("test-unverified", { facts: { verificationStatus } });
    const result = recommend([game], preferences);
    expect(result.recommendations).toHaveLength(0);
    expect(result.diagnostics[0].code).toBe("UNVERIFIED_GAME");
  });

  it("국내 판매·플레이 근거가 모두 없는 게임을 제외한다", () => {
    const game = makeGame("test-no-domestic", { facts: { domesticAvailability: "UNKNOWN" } });
    const result = recommend([game], preferences);
    expect(result.recommendations).toEqual([]);
    expect(result.diagnostics[0].code).toBe("DOMESTIC_EVIDENCE_MISSING");
  });

  it("빈 데이터와 부적합 데이터에서 5개를 임의로 채우지 않는다", () => {
    expect(recommend([], preferences).recommendations).toEqual([]);
    const result = recommend([makeGame("test-one")], preferences);
    expect(result.recommendations).toHaveLength(1);
    expect(result.notices[0]).toContain("1개만");
  });

  it("후보가 많아도 최대 5개만 반환한다", () => {
    const games = Array.from({ length: 8 }, (_, index) => makeGame(`test-${index}`));
    const result = recommend(games, preferences);
    expect(result.recommendations).toHaveLength(5);
    expect(new Set(slugs(result)).size).toBe(5);
  });

  it("정규화된 입력도 실행 시 재검증한다", () => {
    expect(() => recommend([], { ...preferences, playerCount: NaN })).toThrow();
    expect(() => recommend([], { ...preferences, playerCount: 1 })).toThrow();
  });
});

describe("시간 필터와 설명 가능한 완화", () => {
  it("엄격 후보가 5개면 시간 조건을 완화하지 않는다", () => {
    const strict = Array.from({ length: 5 }, (_, index) => makeGame(`test-strict-${index}`));
    const extra = makeGame("test-overlap", { facts: { minPlayTime: 45, maxPlayTime: 90 } });
    const result = recommend([extra, ...strict], preferences);
    expect(slugs(result)).not.toContain("test-overlap");
    expect(result.relaxations).toEqual([]);
    expect(result.recommendations.every((item) => item.relaxation === null)).toBe(true);
  });

  it("엄격 일치, 겹치는 범위, 인접 범위 순으로 보충한다", () => {
    const strict = makeGame("test-strict", { editorial: { bestPlayers: [3], moodTags: ["PARTY"] } });
    const overlap = makeGame("test-overlap", { facts: { minPlayTime: 45, maxPlayTime: 90 } });
    const adjacent = makeGame("test-adjacent", { facts: { minPlayTime: 90, maxPlayTime: 100 } });
    const result = recommend([adjacent, overlap, strict], preferences);
    expect(slugs(result)).toEqual(["test-strict", "test-overlap", "test-adjacent"]);
    expect(result.recommendations.map((item) => item.relaxation?.code ?? null)).toEqual([null, "OVERLAPPING_TIME", "ADJACENT_TIME"]);
    expect(result.recommendations[1].relaxation?.message).toContain("45~90분");
    expect(result.relaxations.map((item) => item.gameSlugs)).toEqual([["test-overlap"], ["test-adjacent"]]);
    expect(result.notices).toContain("시간 조건을 일부 완화했어요. 게임별 완화 이유와 표기 시간을 확인해 주세요.");
  });

  it("엄격 후보가 4개면 겹치는 후보 1개만 추가한다", () => {
    const strict = Array.from({ length: 4 }, (_, index) => makeGame(`test-strict-${index}`));
    const result = recommend([
      makeGame("test-adjacent", { facts: { minPlayTime: 90, maxPlayTime: 100 } }),
      makeGame("test-overlap", { facts: { minPlayTime: 45, maxPlayTime: 90 } }),
      ...strict,
    ], preferences);
    expect(result.recommendations).toHaveLength(5);
    expect(slugs(result).at(-1)).toBe("test-overlap");
    expect(result.relaxations).toHaveLength(1);
    expect(slugs(result)).not.toContain("test-adjacent");
  });

  it("부족해도 인접 구간 밖의 지나치게 넓은 범위는 제외한다", () => {
    const games = [
      makeGame("test-too-wide", { facts: { minPlayTime: 1, maxPlayTime: 600 } }),
      makeGame("test-too-long", { facts: { minPlayTime: 180, maxPlayTime: 180 } }),
    ];
    const result = recommend(games, preferences);
    expect(result.recommendations).toEqual([]);
    expect(result.diagnostics.map((item) => item.code)).toEqual(["TIME_OUT_OF_RANGE", "TIME_OUT_OF_RANGE"]);
  });

  it("120분 이상은 유한한 가짜 상한 없이 처리하고 결과는 JSON으로 보낼 수 있다", () => {
    const result = recommend([
      makeGame("test-long", { facts: { minPlayTime: 180, maxPlayTime: 600 } }),
    ], { ...preferences, playTime: "AT_LEAST_120" });
    expect(result.recommendations[0].relaxation).toBeNull();
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

describe("근거 기반 선호 순위", () => {
  it("국내 재고, 상품 노출, 품절, 국내 플레이 근거 순으로 구분한다", () => {
    const games = [
      makeGame("test-play", { facts: { domesticAvailability: "UNKNOWN", domesticPlayStatus: "CONFIRMED" } }),
      makeGame("test-out", { facts: { domesticAvailability: "OUT_OF_STOCK" } }),
      makeGame("test-listed", { facts: { domesticAvailability: "LISTED" } }),
      makeGame("test-stock"),
    ];
    const result = recommend(games, preferences);
    expect(slugs(result)).toEqual(["test-stock", "test-listed", "test-out", "test-play"]);
    expect(result.recommendations[1].reasons.find((reason) => reason.code === "DOMESTIC_AVAILABILITY")?.message).toContain("재고는 미확인");
    expect(result.recommendations[2].reasons.find((reason) => reason.code === "DOMESTIC_AVAILABILITY")?.kind).toBe("CAUTION");
    expect(result.recommendations[3].reasons.find((reason) => reason.code === "DOMESTIC_AVAILABILITY")?.message).toContain("플레이 근거");
  });

  it("같은 시간 단계에서 국내 확인 상태를 선호도보다 우선한다", () => {
    const listed = makeGame("test-listed", { facts: { domesticAvailability: "LISTED" } });
    const stock = makeGame("test-stock", { editorial: { bestPlayers: [3], moodTags: ["PARTY"], difficulty: "ADVANCED" } });
    expect(slugs(recommend([listed, stock], preferences))).toEqual(["test-stock", "test-listed"]);
  });

  it("추천 인원에 포함된 게임을 우선하되 가능 인원과 구분한다", () => {
    const match = makeGame("test-match", { editorial: { moodTags: ["PARTY"] } });
    const nonMatch = makeGame("test-nonmatch", { editorial: { bestPlayers: [3] } });
    const unknown = makeGame("test-unknown", { editorial: { bestPlayers: [] } });
    const result = recommend([unknown, nonMatch, match], preferences);
    expect(slugs(result)).toEqual(["test-match", "test-nonmatch", "test-unknown"]);
    expect(result.recommendations[0].reasons.some((reason) => reason.code === "BEST_PLAYERS" && reason.kind === "MATCH")).toBe(true);
    expect(result.recommendations[1].reasons.some((reason) => reason.code === "BEST_PLAYERS" && reason.kind === "CAUTION")).toBe(true);
  });

  it("분위기 일치를 우선하고 불일치도 제외 없이 알린다", () => {
    const result = recommend([
      makeGame("test-a-party", { editorial: { moodTags: ["PARTY"] } }),
      makeGame("test-z-strategy"),
    ], preferences);
    expect(slugs(result)).toEqual(["test-z-strategy", "test-a-party"]);
    expect(result.recommendations[1].reasons.find((reason) => reason.code === "MOOD")?.kind).toBe("CAUTION");
  });

  it.each(["PARTY", "STRATEGY", "DEDUCTION", "COOPERATIVE", "RELAXED"] as const)("%s 분위기 선택을 반영한다", (mood) => {
    const game = makeGame("test-mood", { editorial: { moodTags: [mood] } });
    const result = recommend([game], { ...preferences, mood });
    expect(result.recommendations[0].reasons.find((reason) => reason.code === "MOOD")?.kind).toBe("MATCH");
  });

  it("난이도 일치·단계 차이·미확인 순으로 정렬한다", () => {
    const games = [
      makeGame("test-unknown", { editorial: { difficulty: null } }),
      makeGame("test-advanced", { editorial: { difficulty: "ADVANCED" } }),
      makeGame("test-easy"),
      makeGame("test-intermediate", { editorial: { difficulty: "INTERMEDIATE" } }),
    ];
    const result = recommend(games, preferences);
    expect(slugs(result)).toEqual(["test-easy", "test-intermediate", "test-advanced", "test-unknown"]);
    expect(result.recommendations[1].reasons.find((reason) => reason.code === "DIFFICULTY")?.message).toContain("중급");
    expect(result.recommendations[1].reasons.find((reason) => reason.code === "DIFFICULTY")?.kind).toBe("CAUTION");
  });

  it("난이도 상관없음에서는 난이도를 순위나 불일치 이유로 사용하지 않는다", () => {
    const games = [makeGame("test-a-hard", { editorial: { difficulty: "ADVANCED" } }), makeGame("test-z-easy")];
    const result = recommend(games, { ...preferences, difficulty: "ANY" });
    expect(slugs(result)).toEqual(["test-a-hard", "test-z-easy"]);
    expect(result.recommendations.flatMap((item) => item.reasons).some((reason) => reason.code === "DIFFICULTY")).toBe(false);
  });

  it("한국어판이 확인된 높은 언어 의존 게임은 외국어 판본보다 사용 편의를 반영한다", () => {
    const games = [
      makeGame("test-a-foreign", { facts: { koreanEdition: "UNKNOWN" }, editorial: { languageDependency: "HIGH" } }),
      makeGame("test-b-korean", { editorial: { languageDependency: "HIGH" } }),
      makeGame("test-c-none", { editorial: { languageDependency: "NONE" } }),
      makeGame("test-d-unknown", { editorial: { languageDependency: "UNKNOWN" } }),
    ];
    const result = recommend(games, preferences);
    expect(slugs(result)).toEqual(["test-c-none", "test-b-korean", "test-a-foreign", "test-d-unknown"]);
    expect(result.recommendations[1].reasons.find((reason) => reason.code === "LANGUAGE")?.message).toContain("한국어판을 사용하면");
    expect(result.recommendations[2].reasons.find((reason) => reason.code === "LANGUAGE")?.kind).toBe("CAUTION");
  });

  it.each(["PENDING", "STALE", "REJECTED"] as const)("%s 편집 태그와 난이도를 사용하지 않는다", (verificationStatus) => {
    const game = makeGame("test-editorial", { editorial: { verificationStatus } });
    const result = recommend([game], preferences);
    const { game: output, reasons } = result.recommendations[0];
    expect(output.bestPlayers).toEqual([]);
    expect(output.moodTags).toEqual([]);
    expect(output.categories).toEqual([]);
    expect(output.difficulty).toBeNull();
    expect(output.descriptionKo).toBeNull();
    expect(reasons.some((reason) => reason.kind === "MATCH" && ["BEST_PLAYERS", "MOOD", "DIFFICULTY"].includes(reason.code))).toBe(false);
  });
});

describe("다양성·중복·누락·순수성", () => {
  it("선호 조건이 같은 후보 사이에서 다른 주요 장르를 먼저 보여준다", () => {
    const games = [
      makeGame("test-a", { editorial: { categories: ["장르 A"] } }),
      makeGame("test-b", { editorial: { categories: ["장르 A"] } }),
      makeGame("test-c", { editorial: { categories: ["장르 B"] } }),
    ];
    expect(slugs(recommend(games, preferences))).toEqual(["test-a", "test-c", "test-b"]);
  });

  it("장르가 같으면 다른 주요 메커니즘을 고려한다", () => {
    const games = [makeGame("test-a"), makeGame("test-b"), makeGame("test-c", { editorial: { mechanics: ["다른 메커니즘"] } })];
    expect(slugs(recommend(games, preferences))).toEqual(["test-a", "test-c", "test-b"]);
  });

  it("다양성을 위해 선호 일치 후보를 불일치 후보 뒤로 밀지 않는다", () => {
    const games = [
      makeGame("test-a"), makeGame("test-b"),
      makeGame("test-c", { editorial: { categories: ["새 장르"], moodTags: ["PARTY"] } }),
    ];
    expect(slugs(recommend(games, preferences))).toEqual(["test-a", "test-b", "test-c"]);
  });

  it("장르·메커니즘 누락을 다양성 보너스로 취급하지 않는다", () => {
    const games = [makeGame("test-a-unknown", { editorial: { categories: [], mechanics: [] } }), makeGame("test-z-known")];
    expect(slugs(recommend(games, preferences))).toEqual(["test-z-known", "test-a-unknown"]);
  });

  it("같은 slug 또는 id를 가진 후보를 중복 추천하지 않는다", () => {
    const sameId = "00000000-0000-4000-8000-000000000001";
    const first = makeGame("test-first", { id: sameId });
    const sameSlug = makeGame("test-first");
    const otherSlug = makeGame("test-other-slug", { id: sameId });
    const separate = makeGame("test-separate");
    const result = recommend([first, sameSlug, otherSlug, separate], preferences);
    expect(slugs(result)).toEqual(["test-first", "test-separate"]);
    expect(result.diagnostics.filter((item) => item.code === "DUPLICATE_GAME")).toHaveLength(2);
  });

  it("잘못된 레코드는 진단하고 정상 레코드를 계속 추천한다", () => {
    const good = makeGame("test-valid");
    const broken = { ...good, facts: { ...good.facts, minPlayers: "비공개 잘못된 값" } };
    const result = recommend([null, {}, broken, good], preferences);
    expect(slugs(result)).toEqual(["test-valid"]);
    expect(result.diagnostics.filter((item) => item.code === "INVALID_GAME")).toHaveLength(3);
    expect(JSON.stringify(result.diagnostics)).not.toContain("비공개 잘못된 값");
  });

  it("필수 인원·시간·출처가 빠진 값을 추정하지 않는다", () => {
    const good = makeGame("test-valid");
    const { minPlayTime: omitted, ...facts } = good.facts;
    expect(omitted).toBe(30);
    expect(recommend([{ ...good, facts }], preferences).recommendations).toEqual([]);
    expect(recommend([{ ...good, sources: [] }], preferences).recommendations).toEqual([]);
    const { minPlayers: omittedPlayers, ...remainingFacts } = good.facts;
    expect(omittedPlayers).toBe(2);
    expect(recommend([{ ...good, facts: remainingFacts }], preferences).recommendations).toEqual([]);
  });

  it("편집 자체가 없는 게임은 사실만 사용하고 미확인 항목을 알린다", () => {
    const result = recommend([makeGame("test-no-editorial", { editorial: null })], preferences);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].game.languageDependency).toBe("UNKNOWN");
    expect(result.recommendations[0].reasons.find((reason) => reason.code === "MOOD")?.kind).toBe("INFO");
  });

  it("repository의 id·날짜 메타데이터와 함께 사용할 수 있다", () => {
    const game = {
      ...makeGame("test-metadata", { id: "00000000-0000-4000-8000-000000000001" }),
      createdAt: "2026-11-02T16:54:27Z", updatedAt: "2026-11-02T16:54:27Z",
    };
    const result = recommend([game], preferences);
    expect(result.recommendations[0].game.id).toBe(game.id);
    expect(result.recommendations[0].game.detailPath).toBe("/games/test-metadata");
  });

  it("실제 샘플의 미검토 태그와 평균을 임의 보완하지 않는다", () => {
    const result = recommend([splendor], preferences);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].game.bestPlayers).toEqual([]);
    expect(result.recommendations[0].game.moodTags).toEqual([]);
    expect(result.recommendations[0].game.averagePlayTime).toBeNull();
    expect(result.recommendations[0].game.difficulty).toBeNull();
  });

  it("입력과 결과 간 참조를 공유하지 않고 동일 입력에 같은 결과를 낸다", () => {
    const games = deepFreeze([makeGame("test-b"), makeGame("test-a")]);
    const frozenPreferences = deepFreeze({ ...preferences });
    const before = JSON.stringify(games);
    const first = recommend(games, frozenPreferences);
    expect(recommend(games, frozenPreferences)).toEqual(first);
    expect(recommend([...games].reverse(), frozenPreferences)).toEqual(first);
    first.recommendations[0].game.bestPlayers.push(999);
    expect(JSON.stringify(games)).toBe(before);
    expect(recommend(games, frozenPreferences).recommendations[0].game.bestPlayers).not.toContain(999);
    expect(JSON.stringify(first)).not.toMatch(/"(score|fitPercentage|confidence)":/);
  });
});
