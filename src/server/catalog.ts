import "server-only";
import { z } from "zod";
import { loadGameDataset } from "../../data/catalog";
import approvals from "../../data/publication-approvals.json";
import { recommendationGameSchema, type RecommendationGame } from "../domain/recommendation/types";
import { listVerifiedBoardGames } from "./games";
import { publicationDigest } from "../domain/data-import/digest";

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
    recordDigest: z.string().regex(/^[a-f0-9]{64}$/),
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
    return { status: "ready", preview: true, games: loadGameDataset().map((record) => recommendationGameSchema.parse(record)) };
  }
  const publication = approvalsSchema.safeParse(options.approvals ?? approvals);
  if (!publication.success) return { status: "unavailable" };
  if (publication.data.approvedGames.length === 0) return { status: "pending" };

  try {
    const approved = new Map(publication.data.approvedGames.map((item) => [item.slug, item.recordDigest]));
    const records = await (options.listGames ?? listVerifiedBoardGames)();
    const games: RecommendationGame[] = [];
    for (const record of records) {
      const result = recommendationGameSchema.safeParse(record);
      if (result.success && result.data.facts.verificationStatus === "VERIFIED" && approved.get(result.data.facts.slug) === publicationDigest(result.data)) {
        games.push(result.data);
      }
    }
    return games.length > 0 ? { status: "ready", preview: false, games } : { status: "pending" };
  } catch {
    // Never send driver errors, credentials or a fabricated fallback to the page.
    return { status: "unavailable" };
  }
}
