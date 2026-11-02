import "server-only";
import type { PrismaClient } from "../generated/prisma/client";
import { boardGameRecordSchema } from "../domain/games/schema";
import { getDatabase } from "./db";

export async function listVerifiedBoardGames(database: Pick<PrismaClient, "boardGame"> = getDatabase()) {
  const rows = await database.boardGame.findMany({
    where: { verificationStatus: "VERIFIED" },
    include: { editorial: true, sources: { include: { observations: true } }, externalIds: true },
    orderBy: { slug: "asc" },
  });

  return rows.map((row) => {
    const editorial = row.editorial;
    const record = boardGameRecordSchema.parse({
      facts: {
        slug: row.slug,
        nameKo: row.nameKo,
        nameEn: row.nameEn,
        editionNote: row.editionNote,
        minPlayers: row.minPlayers,
        maxPlayers: row.maxPlayers,
        minPlayTime: row.minPlayTime,
        maxPlayTime: row.maxPlayTime,
        averagePlayTime: row.averagePlayTime,
        complexity: row.complexity?.toNumber() ?? null,
        complexityScale: row.complexityScale,
        koreanEdition: row.koreanEdition,
        domesticAvailability: row.domesticAvailability,
        domesticPlayStatus: row.domesticPlayStatus,
        domesticPopularityStatus: row.domesticPopularityStatus,
        verificationStatus: row.verificationStatus,
        lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
      },
      editorial: editorial?.verificationStatus === "VERIFIED" ? {
        bestPlayers: editorial.bestPlayers,
        categories: editorial.categories,
        mechanics: editorial.mechanics,
        moodTags: editorial.moodTags,
        difficulty: editorial.difficulty,
        languageDependency: editorial.languageDependency,
        descriptionKo: editorial.descriptionKo,
        setupKo: editorial.setupKo,
        howToPlayKo: editorial.howToPlayKo,
        victoryKo: editorial.victoryKo,
        recommendedForKo: editorial.recommendedForKo,
        cautionsKo: editorial.cautionsKo,
        rationaleKo: editorial.rationaleKo,
        author: editorial.author,
        verificationStatus: editorial.verificationStatus,
        reviewedAt: editorial.reviewedAt?.toISOString() ?? null,
      } : null,
      sources: row.sources.map((source) => ({
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        sourceType: source.sourceType,
        verifiedAt: source.verifiedAt.toISOString(),
        observations: source.observations.map((observation) => ({
          verifiedAt: observation.verifiedAt.toISOString(),
          verificationStatus: observation.verificationStatus,
          checkedFields: observation.checkedFields,
          observedFacts: observation.observedFacts,
          collectionMethod: observation.collectionMethod,
          reviewedBy: observation.reviewedBy,
          evidenceNoteKo: observation.evidenceNoteKo,
          usageStatus: observation.usageStatus,
          usageNoteKo: observation.usageNoteKo,
        })),
      })),
      externalIds: row.externalIds.map(({ provider, externalId }) => ({ provider, externalId })),
    });

    return { id: row.id, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), ...record };
  });
}
