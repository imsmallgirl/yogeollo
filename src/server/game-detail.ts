import "server-only";
import { cache } from "react";
import draftGuide from "../../data/guides/splendor.json";
import { gameFactsSchema } from "../domain/games/schema";
import { gameGuideSchema } from "../domain/games/guide";
import { loadRecommendationCatalog } from "./catalog";

export async function getGameDetail(slug: string, loadCatalog = loadRecommendationCatalog) {
  if (!gameFactsSchema.shape.slug.safeParse(slug).success) return { status: "not-found" as const };
  const catalog = await loadCatalog();
  if (catalog.status === "unavailable") return { status: "unavailable" as const };
  if (catalog.status !== "ready") return { status: "not-found" as const };
  const game = catalog.games.find((candidate) => candidate.facts.slug === slug);
  if (!game) return { status: "not-found" as const };
  const editorial = game.editorial?.verificationStatus === "VERIFIED" ? game.editorial : null;
  // Authored draft remains separate from recommendation tags and is never served in production.
  const guide = catalog.preview && slug === draftGuide.slug ? gameGuideSchema.parse(draftGuide) : null;
  return { status: "found" as const, game, editorial, guide, preview: catalog.preview };
}

// Metadata and the page share one catalog read within the request.
export const loadGameDetail = cache((slug: string) => getGameDetail(slug));
