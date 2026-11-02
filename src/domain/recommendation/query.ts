import { recommendationInputSchema, recommendationPreferencesSchema, type RecommendationPreferences } from "./preferences";

export type RecommendationField = "players" | "exactPlayers" | "playTime" | "mood" | "difficulty";
export type RecommendationErrors = Partial<Record<RecommendationField, string>>;
export const defaultPreferences: RecommendationPreferences = {
  playerCount: 4, playTime: "BETWEEN_30_60", mood: "RELAXED", difficulty: "ANY",
};

const fieldMessages: Record<RecommendationField, string> = {
  players: "모임 인원수를 하나만 선택해 주세요.",
  exactPlayers: "7명 이상의 정확한 인원수를 정수로 입력해 주세요.",
  playTime: "플레이 시간을 하나만 선택해 주세요.",
  mood: "원하는 분위기를 하나만 선택해 주세요.",
  difficulty: "난이도를 하나만 선택해 주세요.",
};

export function parseRecommendationQuery(query: unknown):
  { success: true; preferences: RecommendationPreferences } |
  { success: false; errors: RecommendationErrors; message: string } {
  // Strict schema rejects unknown parameters and repeated keys (string arrays).
  const result = recommendationInputSchema.safeParse(query);
  if (result.success) return { success: true, preferences: result.data };
  const errors: RecommendationErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && Object.hasOwn(fieldMessages, field)) {
      const key = field as RecommendationField;
      errors[key] = fieldMessages[key];
    }
  }
  return { success: false, errors, message: "주소의 추천 조건을 확인해 주세요. 조건을 다시 선택하면 계속할 수 있어요." };
}

export function recommendationQuery(input: RecommendationPreferences): string {
  const preferences = recommendationPreferencesSchema.parse(input);
  const query = new URLSearchParams();
  query.set("players", preferences.playerCount >= 7 ? "7-plus" : String(preferences.playerCount));
  if (preferences.playerCount >= 7) query.set("exactPlayers", String(preferences.playerCount));
  query.set("playTime", preferences.playTime);
  query.set("mood", preferences.mood);
  query.set("difficulty", preferences.difficulty);
  return query.toString();
}

export function recommendationHref(preferences: RecommendationPreferences) {
  return `/recommend?${recommendationQuery(preferences)}`;
}

export function editRecommendationHref(preferences: RecommendationPreferences) {
  return `/?${recommendationQuery(preferences)}#find-game`;
}
