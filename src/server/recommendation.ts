import "server-only";
import { parseRecommendationQuery } from "../domain/recommendation/query";
import { recommend } from "../domain/recommendation/recommend";
import { loadRecommendationCatalog } from "./catalog";

export async function getRecommendationPageData(
  query: unknown,
  loadCatalog = loadRecommendationCatalog,
) {
  const parsed = parseRecommendationQuery(query);
  if (!parsed.success) return { status: "invalid" as const, ...parsed };
  const catalog = await loadCatalog();
  if (catalog.status !== "ready") return { status: catalog.status, preferences: parsed.preferences };
  return {
    status: "ready" as const,
    preview: catalog.preview,
    catalogSize: catalog.games.length,
    result: recommend(catalog.games, parsed.preferences),
  };
}
