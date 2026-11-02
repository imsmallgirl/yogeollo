import { recommendationPreferencesSchema, type RecommendationPreferences } from "./preferences";
import { explainRecommendation } from "./reasons";
import { classifyPlayTime, explainTimeRelaxation } from "./time";
import {
  recommendationGameSchema,
  type Recommendation,
  type RecommendationDiagnostic,
  type RecommendationGame,
  type RecommendationResult,
  type TimeMatch,
  type VerifiedEditorial,
} from "./types";

const LIMIT = 5;
const difficultyOrder = ["BEGINNER", "EASY", "INTERMEDIATE", "ADVANCED"] as const;

interface Candidate {
  record: RecommendationGame;
  editorial: VerifiedEditorial | null;
  timeMatch: TimeMatch;
  // Ordinal comparisons from known fields, not a probability or fit percentage.
  rank: readonly number[];
}

function compareNumbers(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function languageRank(game: RecommendationGame, editorial: VerifiedEditorial | null): number {
  const dependency = editorial?.languageDependency ?? "UNKNOWN";
  if (dependency === "NONE") return 0;
  if (dependency === "LOW") return 1;
  if (dependency === "UNKNOWN") return 4;
  if (game.facts.koreanEdition === "CONFIRMED") return 1;
  return dependency === "MEDIUM" ? 2 : 3;
}

function preferenceRank(
  game: RecommendationGame,
  editorial: VerifiedEditorial | null,
  timeMatch: TimeMatch,
  preferences: RecommendationPreferences,
): readonly number[] {
  const bestPlayersRank = !editorial?.bestPlayers.length ? 2 :
    editorial.bestPlayers.includes(preferences.playerCount) ? 0 : 1;
  const moodRank = !editorial?.moodTags.length ? 2 : editorial.moodTags.includes(preferences.mood) ? 0 : 1;
  const difficultyRank = preferences.difficulty === "ANY" ? 0 : !editorial?.difficulty ? 4 :
    Math.abs(difficultyOrder.indexOf(editorial.difficulty) - difficultyOrder.indexOf(preferences.difficulty));
  return [
    { STRICT: 0, OVERLAPPING_TIME: 1, ADJACENT_TIME: 2 }[timeMatch],
    { IN_STOCK: 0, LISTED: 1, OUT_OF_STOCK: 2, UNKNOWN: 3 }[game.facts.domesticAvailability],
    bestPlayersRank, moodRank, difficultyRank, languageRank(game, editorial),
  ];
}

function diversityRank(candidate: Candidate, selected: readonly Candidate[]): readonly number[] {
  // The first category/mechanic is the primary one, maintained by editorial review.
  // Missing tags must not gain a novelty bonus over known genres or mechanics.
  const category = candidate.editorial?.categories[0];
  const mechanic = candidate.editorial?.mechanics[0];
  return [
    category ? selected.filter((item) => item.editorial?.categories[0] === category).length : selected.length + 1,
    mechanic ? selected.filter((item) => item.editorial?.mechanics[0] === mechanic).length : selected.length + 1,
  ];
}

function toRecommendation(candidate: Candidate, preferences: RecommendationPreferences): Recommendation {
  const { record, editorial, timeMatch } = candidate;
  const facts = record.facts;
  const relaxation = explainTimeRelaxation(facts.minPlayTime, facts.maxPlayTime, preferences.playTime, timeMatch);
  return {
    game: {
      id: record.id ?? null,
      slug: facts.slug,
      nameKo: facts.nameKo,
      nameEn: facts.nameEn,
      minPlayers: facts.minPlayers,
      maxPlayers: facts.maxPlayers,
      bestPlayers: [...(editorial?.bestPlayers ?? [])],
      minPlayTime: facts.minPlayTime,
      maxPlayTime: facts.maxPlayTime,
      averagePlayTime: facts.averagePlayTime,
      complexity: facts.complexity,
      complexityScale: facts.complexityScale,
      difficulty: editorial?.difficulty ?? null,
      categories: [...(editorial?.categories ?? [])],
      mechanics: [...(editorial?.mechanics ?? [])],
      moodTags: [...(editorial?.moodTags ?? [])],
      languageDependency: editorial?.languageDependency ?? "UNKNOWN",
      koreanEdition: facts.koreanEdition,
      domesticAvailability: facts.domesticAvailability,
      domesticPlayStatus: facts.domesticPlayStatus,
      descriptionKo: editorial?.descriptionKo ?? null,
      lastVerifiedAt: facts.lastVerifiedAt,
      detailPath: `/games/${facts.slug}`,
    },
    reasons: explainRecommendation(record, editorial, preferences, relaxation),
    relaxation,
  };
}

/** Pure, deterministic engine. Invalid preferences throw; bad records are diagnosed and skipped. */
export function recommend(
  games: readonly unknown[],
  input: RecommendationPreferences,
): RecommendationResult {
  const preferences = recommendationPreferencesSchema.parse(input);
  const diagnostics: RecommendationDiagnostic[] = [];
  const candidates: Candidate[] = [];
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();

  games.forEach((raw, inputIndex) => {
    const parsed = recommendationGameSchema.safeParse(raw);
    if (!parsed.success) {
      diagnostics.push({
        inputIndex, code: "INVALID_GAME",
        invalidPaths: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))],
      });
      return;
    }
    const record = parsed.data;
    const facts = record.facts;
    const exclude = (code: RecommendationDiagnostic["code"]) => {
      diagnostics.push({ inputIndex, slug: facts.slug, code });
    };
    if (facts.verificationStatus !== "VERIFIED") return exclude("UNVERIFIED_GAME");
    if (preferences.playerCount < facts.minPlayers || preferences.playerCount > facts.maxPlayers) {
      return exclude("PLAYER_COUNT_MISMATCH");
    }
    if (facts.domesticAvailability === "UNKNOWN" && facts.domesticPlayStatus !== "CONFIRMED") {
      return exclude("DOMESTIC_EVIDENCE_MISSING");
    }
    const timeMatch = classifyPlayTime(facts.minPlayTime, facts.maxPlayTime, preferences.playTime);
    if (timeMatch === null) return exclude("TIME_OUT_OF_RANGE");
    // Keep the first eligible record for each identity. Do not merge contradictory editions.
    if (seenSlugs.has(facts.slug) || (record.id !== undefined && seenIds.has(record.id))) {
      return exclude("DUPLICATE_GAME");
    }
    seenSlugs.add(facts.slug);
    if (record.id !== undefined) seenIds.add(record.id);

    const editorial = record.editorial?.verificationStatus === "VERIFIED" ? record.editorial : null;
    candidates.push({ record, editorial, timeMatch, rank: preferenceRank(record, editorial, timeMatch, preferences) });
  });

  const selected: Candidate[] = [];
  const remaining = [...candidates];
  while (selected.length < LIMIT && remaining.length > 0) {
    remaining.sort((left, right) =>
      compareNumbers(left.rank, right.rank) ||
      compareNumbers(diversityRank(left, selected), diversityRank(right, selected)) ||
      compareText(left.record.facts.slug, right.record.facts.slug),
    );
    selected.push(remaining[0]);
    remaining.splice(0, 1);
  }

  const recommendations = selected.map((candidate) => toRecommendation(candidate, preferences));
  const relaxations: RecommendationResult["relaxations"] = [];
  for (const { game, relaxation } of recommendations) {
    if (!relaxation) continue;
    const existing = relaxations.find((item) => item.code === relaxation.code);
    if (existing) {
      existing.gameSlugs.push(game.slug);
    } else {
      relaxations.push({
        code: relaxation.code,
        message: relaxation.code === "OVERLAPPING_TIME" ?
          "결과가 부족해 선택 시간과 일부만 겹치는 게임을 추가했어요. 각 게임의 실제 표기 시간을 확인해 주세요." :
          "결과가 부족해 바로 인접한 시간 구간의 게임을 추가했어요. 각 게임의 실제 표기 시간을 확인해 주세요.",
        gameSlugs: [game.slug],
      });
    }
  }
  const notices: string[] = [];
  if (recommendations.length === 0) {
    notices.push("인원·검증 조건을 유지하고 인접 시간까지 확인했지만 추천할 게임을 찾지 못했어요. 인원이나 시간을 바꿔 주세요.");
  } else if (recommendations.length < LIMIT) {
    notices.push(`인원과 허용된 시간 범위 안에서 확인된 후보가 ${recommendations.length}개여서 ${recommendations.length}개만 추천해요.`);
  }
  if (relaxations.length > 0) notices.push("시간 조건을 일부 완화했어요. 게임별 완화 이유와 표기 시간을 확인해 주세요.");

  return { preferences, recommendations, notices, relaxations, diagnostics };
}
