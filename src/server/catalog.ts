import "server-only";
import { z } from "zod";
import splendor from "../../data/games/splendor.json";
import approvals from "../../data/publication-approvals.json";
import { recommendationGameSchema, type RecommendationGame } from "../domain/recommendation/types";
import { listVerifiedBoardGames } from "./games";

interface CatalogEnvironment { NODE_ENV?: string; GAME_DATA_MODE?: string }
export type RecommendationCatalog =
  { status: "ready"; preview: boolean; games: RecommendationGame[] } |
  { status: "pending" | "unavailable" };

const approvalsSchema = z.strictObject({
  approvedGames: z.array(z.strictObject({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    reviewedBy: z.string().trim().min(1),
    approvedAt: z.iso.datetime({ offset: true }),
    usageBasis: z.string().trim().min(1),
  })).refine((items) => new Set(items.map((item) => item.slug)).size === items.length),
});

export function catalogMode(environment: CatalogEnvironment = process.env): "preview" | "database" | "blocked" | "invalid" {
  const development = environment.NODE_ENV === "development" || environment.NODE_ENV === "test";
  const mode = environment.GAME_DATA_MODE ?? (development ? "preview" : "database");
  if (mode !== "preview" && mode !== "database") return "invalid";
  if (mode === "preview" && !development) return "blocked";
  return mode;
}

export async function loadRecommendationCatalog(options: {
  environment?: CatalogEnvironment;
  approvals?: unknown;
  listGames?: () => Promise<readonly unknown[]>;
} = {}): Promise<RecommendationCatalog> {
  const mode = catalogMode(options.environment);
  if (mode === "invalid") return { status: "unavailable" };
  if (mode === "blocked") return { status: "pending" };
  if (mode === "preview") {
    return { status: "ready", preview: true, games: [recommendationGameSchema.parse(splendor)] };
  }
  const publication = approvalsSchema.safeParse(options.approvals ?? approvals);
  if (!publication.success) return { status: "unavailable" };
  if (publication.data.approvedGames.length === 0) return { status: "pending" };

  try {
    const approvedSlugs = new Set(publication.data.approvedGames.map((item) => item.slug));
    const records = await (options.listGames ?? listVerifiedBoardGames)();
    const games: RecommendationGame[] = [];
    for (const record of records) {
      const result = recommendationGameSchema.safeParse(record);
      if (result.success && result.data.facts.verificationStatus === "VERIFIED" && approvedSlugs.has(result.data.facts.slug)) {
        games.push(result.data);
      }
    }
    return games.length > 0 ? { status: "ready", preview: false, games } : { status: "pending" };
  } catch {
    // Never send driver errors, credentials or a fabricated fallback to the page.
    return { status: "unavailable" };
  }
}
