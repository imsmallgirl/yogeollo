import { open } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { z } from "zod";
import { createDatabaseClient } from "../prisma/client";
import { applyImport, inspectImport, publicationCandidate, reviewImport, stageImport } from "../prisma/import-service";
import { contentDigest, publicationDigest } from "../src/domain/data-import/digest";
import { importPackageSchema, ImportError, type ImportPackage } from "../src/domain/data-import/schema";
import { planImport } from "../src/domain/data-import/plan";

const output = (value: unknown) => console.info(JSON.stringify(value, null, 2));
const required = (value: string | undefined) => {
  if (!value) throw new ImportError("MISSING_OPTION", "필수 명령 옵션을 확인해 주세요.");
  return value;
};

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true, strict: true,
    options: { file: { type: "string" }, batch: { type: "string" }, decision: { type: "string" }, reviewer: { type: "string" }, notes: { type: "string" }, digest: { type: "string" }, slug: { type: "string" } },
  });
  const command = positionals[0];
  if (positionals.length !== 1 || !["check", "stage", "inspect", "review", "apply", "publication"].includes(command)) throw new ImportError("UNKNOWN_COMMAND", "check, stage, inspect, review, apply, publication 중 하나를 사용해 주세요.");
  let payload: ImportPackage | undefined;
  if (command === "check" || command === "stage") {
    const handle = await open(resolve(required(values.file)), "r");
    const buffer = Buffer.alloc(2 * 1024 * 1024 + 1);
    let file: Buffer;
    try {
      let bytes = 0;
      while (bytes < buffer.length) {
        const read = await handle.read(buffer, bytes, buffer.length - bytes, null);
        if (!read.bytesRead) break;
        bytes += read.bytesRead;
      }
      file = buffer.subarray(0, bytes);
    } finally { await handle.close(); }
    if (file.byteLength > 2 * 1024 * 1024) throw new ImportError("FILE_TOO_LARGE", "수집 파일은 2MiB 이하여야 합니다.");
    const input: unknown = JSON.parse(file.toString("utf8"));
    payload = importPackageSchema.parse(input);
  }
  if (command === "check") {
    const plan = planImport(payload!, [], new Date().toISOString());
    output({ valid: true, databaseCompared: false, digest: contentDigest(payload), recordCount: payload!.games.length, eligibleForReview: plan.issues.length === 0, ...plan });
    if (plan.issues.length) process.exitCode = 2;
    return;
  }
  nextEnv.loadEnvConfig(process.cwd());
  const database = createDatabaseClient(process.env.DATABASE_URL);
  try {
    if (command === "publication") {
      const record = await publicationCandidate(database, required(values.slug));
      output({ slug: record.facts.slug, recordDigest: publicationDigest(record), verificationStatus: record.facts.verificationStatus, message: "이 내용과 출처·이용 범위를 실제 검토한 후 별도 공개 목록에 기록하세요. 이 명령은 공개하지 않습니다." });
      return;
    }
    const batch = command === "stage" ? await stageImport(database, payload) :
      command === "review" ? await reviewImport(database, {
        id: required(values.batch), expectedDigest: required(values.digest),
        decision: z.enum(["approve", "reject"]).parse(values.decision),
        reviewer: required(values.reviewer), notes: required(values.notes),
      }) : command === "apply" ? await applyImport(database, required(values.batch)) : await inspectImport(database, required(values.batch));
    // Full pending content is printed only for explicit local inspection.
    output(command === "inspect" ? batch : { id: batch.id, digest: batch.digest, status: batch.status, plan: batch.plan, reviewedBy: batch.reviewedBy, appliedAt: batch.appliedAt });
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof z.ZodError) output({ code: "INVALID_INPUT", message: "입력 형식·필수 필드·출처를 확인해 주세요.", paths: error.issues.map((issue) => issue.path.join(".")) });
  else if (error instanceof ImportError) output({ code: error.code, message: error.message });
  else output({ code: "IMPORT_FAILED", message: "파일·명령 옵션·DB 연결·마이그레이션을 확인해 주세요. 원시 오류나 연결 정보는 출력하지 않습니다." });
  process.exitCode = 1;
});
