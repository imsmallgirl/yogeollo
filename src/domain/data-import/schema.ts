import { z } from "zod";
import { gameDatasetSchema } from "../games/schema";

export const importPackageSchema = z.strictObject({
  version: z.literal(1),
  revision: z.number().int().positive(),
  label: z.string().trim().min(1).max(200),
  collectedBy: z.string().trim().min(1).max(200),
  collectedAt: z.iso.datetime({ offset: true }),
  acquisition: z.strictObject({
    method: z.enum(["MANUAL_REVIEW", "PERMITTED_FILE"]),
    permissionStatus: z.enum(["UNCONFIRMED", "CONFIRMED"]),
    permissionBasis: z.string().trim().min(1).max(4000),
  }),
  games: gameDatasetSchema.refine((games) => games.length >= 1 && games.length <= 100, "게임은 1~100개여야 합니다."),
}).superRefine((payload, context) => {
  const externalKeys = new Set<string>();
  payload.games.forEach((game, index) => {
    if (game.editorial !== null) context.addIssue({ code: "custom", path: ["games", index, "editorial"], message: "외부 자료 가져오기에는 자체 편집을 포함할 수 없습니다." });
    if (game.facts.complexity !== null && Math.abs(game.facts.complexity * 100 - Math.round(game.facts.complexity * 100)) > 1e-8) context.addIssue({ code: "custom", path: ["games", index, "facts", "complexity"], message: "DB 반올림을 피하도록 난이도는 소수 둘째 자리까지만 입력하세요." });
    const dates = [game.facts.lastVerifiedAt, ...game.sources.flatMap((source) => [source.verifiedAt, ...source.observations.map((item) => item.verifiedAt)])];
    if (dates.some((date) => date && /\.\d{4,}/.test(date))) context.addIssue({ code: "custom", path: ["games", index], message: "확인일은 DB 정밀도에 맞게 밀리초까지만 입력하세요." });
    const providers = new Set<string>();
    game.externalIds.forEach((external, externalIndex) => {
      const provider = external.provider.trim().toLowerCase();
      const key = JSON.stringify([provider, external.externalId]);
      if (providers.has(provider) || externalKeys.has(key)) context.addIssue({ code: "custom", path: ["games", index, "externalIds", externalIndex], message: "대소문자만 다른 제공자나 외부 ID 중복을 확인해 주세요." });
      providers.add(provider); externalKeys.add(key);
    });
    game.sources.forEach((source, sourceIndex) => {
      const url = URL.canParse(source.sourceUrl) ? new URL(source.sourceUrl) : null;
      if (url && (url.username || url.password)) context.addIssue({ code: "custom", path: ["games", index, "sources", sourceIndex, "sourceUrl"], message: "인증정보가 포함된 출처 URL은 사용할 수 없습니다." });
    });
  });
});

export type ImportPackage = z.infer<typeof importPackageSchema>;
export interface ImportIssue { code: string; slug: string | null; message: string }
export interface ImportChange {
  slug: string;
  action: "CREATE" | "UPDATE" | "NOOP";
  changedFields: string[];
  addedSources: number;
  addedObservations: number;
  addedExternalIds: number;
}
export interface ImportPlan { changes: ImportChange[]; issues: ImportIssue[] }

export class ImportError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "ImportError"; }
}
