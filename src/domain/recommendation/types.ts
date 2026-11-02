import { z } from "zod";
import { boardGameRecordSchema } from "../games/schema";
import type { RecommendationPreferences } from "./preferences";

// Preserve the existing provenance checks and accept optional repository metadata.
export const recommendationGameSchema = boardGameRecordSchema.safeExtend({
  id: z.uuid().optional(),
  createdAt: z.iso.datetime({ offset: true }).optional(),
  updatedAt: z.iso.datetime({ offset: true }).optional(),
});

export type RecommendationGame = z.infer<typeof recommendationGameSchema>;
export type VerifiedEditorial = NonNullable<RecommendationGame["editorial"]>;
export type TimeMatch = "STRICT" | "OVERLAPPING_TIME" | "ADJACENT_TIME";
export type TimeRelaxationCode = Exclude<TimeMatch, "STRICT">;

export interface TimeRelaxation {
  code: TimeRelaxationCode;
  message: string;
}

export interface RecommendationExplanation {
  code: "PLAYERS" | "BEST_PLAYERS" | "TIME" | "MOOD" | "DIFFICULTY" | "LANGUAGE" | "DOMESTIC_AVAILABILITY";
  kind: "MATCH" | "INFO" | "CAUTION";
  message: string;
}

export interface RecommendedGame {
  id: string | null;
  slug: string;
  nameKo: string;
  nameEn: string | null;
  minPlayers: number;
  maxPlayers: number;
  bestPlayers: number[];
  minPlayTime: number;
  maxPlayTime: number;
  averagePlayTime: number | null;
  complexity: number | null;
  complexityScale: string | null;
  difficulty: VerifiedEditorial["difficulty"];
  categories: string[];
  mechanics: string[];
  moodTags: VerifiedEditorial["moodTags"];
  languageDependency: VerifiedEditorial["languageDependency"];
  koreanEdition: RecommendationGame["facts"]["koreanEdition"];
  domesticAvailability: RecommendationGame["facts"]["domesticAvailability"];
  domesticPlayStatus: RecommendationGame["facts"]["domesticPlayStatus"];
  descriptionKo: string | null;
  lastVerifiedAt: string | null;
  detailPath: string;
}

export interface Recommendation {
  game: RecommendedGame;
  reasons: RecommendationExplanation[];
  relaxation: TimeRelaxation | null;
}

export interface RecommendationDiagnostic {
  inputIndex: number;
  code: "INVALID_GAME" | "UNVERIFIED_GAME" | "DOMESTIC_EVIDENCE_MISSING" |
    "PLAYER_COUNT_MISMATCH" | "TIME_OUT_OF_RANGE" | "DUPLICATE_GAME";
  slug?: string;
  invalidPaths?: string[];
}

export interface RecommendationResult {
  preferences: RecommendationPreferences;
  recommendations: Recommendation[];
  notices: string[];
  relaxations: Array<TimeRelaxation & { gameSlugs: string[] }>;
  /** Internal diagnostics, not raw source records or user-facing error messages. */
  diagnostics: RecommendationDiagnostic[];
}
