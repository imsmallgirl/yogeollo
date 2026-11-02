import nextEnv from "@next/env";
import { createDatabaseClient } from "./client";
import { seedGames } from "./seed-data";

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const database = createDatabaseClient(process.env.DATABASE_URL);
  try {
    const ids = await seedGames(database);
    console.info(`샘플 ${ids.length}개를 확인했습니다. 기존 데이터는 덮어쓰지 않았습니다.`);
  } finally {
    await database.$disconnect();
  }
}

main().catch(() => {
  // Driver errors can include credentials or connection details.
  console.error("샘플 입력에 실패했습니다. 환경변수·마이그레이션·샘플 검증 결과를 확인해 주세요.");
  process.exitCode = 1;
});
