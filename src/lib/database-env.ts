import { z } from "zod";

const postgresUrlSchema = z.url({ protocol: /^postgres(?:ql)?$/ }).refine((value) => {
  try {
    return new URL(value).pathname.length > 1;
  } catch {
    return false;
  }
}, "PostgreSQL 데이터베이스 주소가 필요합니다.");

// Report the variable name, never its potentially secret value.
export function parseDatabaseUrl(value: string | undefined): string {
  const result = postgresUrlSchema.safeParse(value);
  if (!result.success) {
    throw new Error("DATABASE_URL에 유효한 PostgreSQL 연결 주소를 설정해 주세요.");
  }
  return result.data;
}
