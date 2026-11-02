import splendor from "../data/games/splendor.json";
import { gameDatasetSchema } from "../src/domain/games/schema";
import type { PrismaClient } from "../src/generated/prisma/client";

export function loadSeedGames() {
  return gameDatasetSchema.parse([splendor]);
}

export async function seedGames(database: PrismaClient) {
  // Validate the whole dataset before any writes; never overwrite existing edits.
  const records = loadSeedGames();
  return database.$transaction(async (transaction) => {
    const ids: string[] = [];
    for (const { facts, editorial, sources, externalIds } of records) {
      const game = await transaction.boardGame.upsert({
        where: { slug: facts.slug },
        update: {},
        create: {
          ...facts,
          editorial: editorial ? { create: editorial } : undefined,
          sources: {
            create: sources.map(({ observations, ...source }) => ({
              ...source,
              observations: { create: observations },
            })),
          },
          externalIds: { create: externalIds },
        },
        select: { id: true },
      });
      ids.push(game.id);
    }
    return ids;
  });
}
