import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseDatabaseUrl } from "../src/lib/database-env";

// Shared by server code and explicit CLI tasks, never by browser modules.
export function createDatabaseClient(connectionString: string | undefined) {
  const adapter = new PrismaPg({
    connectionString: parseDatabaseUrl(connectionString),
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  });
  return new PrismaClient({ adapter });
}
