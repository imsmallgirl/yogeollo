import "server-only";
import { createDatabaseClient } from "../../prisma/client";

const globalForDatabase = globalThis as unknown as {
  yogeolloDatabase?: ReturnType<typeof createDatabaseClient>;
};

// Lazy initialization keeps the preparation page/build independent of the DB.
export function getDatabase() {
  if (!globalForDatabase.yogeolloDatabase) {
    globalForDatabase.yogeolloDatabase = createDatabaseClient(process.env.DATABASE_URL);
  }
  return globalForDatabase.yogeolloDatabase;
}
