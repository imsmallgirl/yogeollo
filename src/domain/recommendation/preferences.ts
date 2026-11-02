import { z } from "zod";
import { gameEditorialSchema, moodTagSchema } from "../games/schema";

export const playTimeSchema = z.enum([
  "UP_TO_15", "BETWEEN_15_30", "BETWEEN_30_60", "BETWEEN_60_120", "AT_LEAST_120",
], { error: "플레이 시간 구간을 선택해 주세요." });

export type PlayTime = z.infer<typeof playTimeSchema>;
export const playTimeOptions: ReadonlyArray<Readonly<{
  value: PlayTime;
  label: string;
  minMinutes: number;
  maxMinutes: number | null;
}>> = [
  { value: "UP_TO_15", label: "15분 이내", minMinutes: 1, maxMinutes: 15 },
  { value: "BETWEEN_15_30", label: "15~30분", minMinutes: 15, maxMinutes: 30 },
  { value: "BETWEEN_30_60", label: "30~60분", minMinutes: 30, maxMinutes: 60 },
  { value: "BETWEEN_60_120", label: "60~120분", minMinutes: 60, maxMinutes: 120 },
  { value: "AT_LEAST_120", label: "120분 이상", minMinutes: 120, maxMinutes: null },
];

const preferredDifficultySchema = z.union([
  gameEditorialSchema.shape.difficulty.unwrap(), z.literal("ANY"),
], { error: "난이도를 선택해 주세요." });

export const moodLabels = {
  PARTY: "웃기고 시끌벅적한 게임",
  STRATEGY: "진지한 전략 게임",
  DEDUCTION: "추리와 심리전",
  COOPERATIVE: "협력하는 게임",
  RELAXED: "편안하고 가벼운 게임",
} as const;

export const difficultyLabels = {
  BEGINNER: "입문자", EASY: "초급", INTERMEDIATE: "중급", ADVANCED: "상급", ANY: "상관없음",
} as const;

const sharedPreferences = {
  playTime: playTimeSchema,
  mood: moodTagSchema,
  difficulty: preferredDifficultySchema,
};

/** Normalized engine input; the exact count is never rounded down to seven. */
export const recommendationPreferencesSchema = z.strictObject({
  playerCount: z.number({ error: "인원수를 숫자로 입력해 주세요." })
    .int({ error: "인원수는 정수여야 합니다." })
    .min(2, { error: "2명 이상 입력해 주세요." }),
  ...sharedPreferences,
});

const exactPlayersSchema = z.union([
  z.number(),
  z.string().regex(/^[0-9]+$/, { error: "정확한 인원수를 정수로 입력해 주세요." }).transform(Number),
]).pipe(z.number().int().min(7, { error: "7명 이상인 정확한 인원수를 입력해 주세요." }));

/** Form/API boundary for the six player selections. URL transport is Phase 3. */
export const recommendationInputSchema = z.discriminatedUnion("players", [
  z.strictObject({ players: z.enum(["2", "3", "4", "5", "6"]), ...sharedPreferences }),
  z.strictObject({ players: z.literal("7-plus"), exactPlayers: exactPlayersSchema, ...sharedPreferences }),
]).transform((input) => ({
  playerCount: input.players === "7-plus" ? input.exactPlayers : Number(input.players),
  playTime: input.playTime,
  mood: input.mood,
  difficulty: input.difficulty,
})).pipe(recommendationPreferencesSchema);

export type RecommendationPreferences = z.infer<typeof recommendationPreferencesSchema>;
