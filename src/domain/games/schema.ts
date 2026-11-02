import { z } from "zod";

export const verificationStatusSchema = z.enum(["PENDING", "VERIFIED", "STALE", "REJECTED"]);
export const languageDependencySchema = z.enum(["UNKNOWN", "NONE", "LOW", "MEDIUM", "HIGH"]);
export const moodTagSchema = z.enum(["PARTY", "STRATEGY", "DEDUCTION", "COOPERATIVE", "RELAXED"]);
const positiveInteger = z.number().int().positive();
const text = z.string().trim().min(1);
const timestamp = z.iso.datetime({ offset: true });
const uniqueIntegers = z.array(positiveInteger).refine(
  (values) => new Set(values).size === values.length,
  "추천 인원을 중복할 수 없습니다.",
);
const uniqueTexts = z.array(text).refine((values) => new Set(values).size === values.length);
const webUrl = z.url({ protocol: /^https?$/ });

export const gameFactsSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nameKo: text,
  nameEn: text.nullable(),
  editionNote: text,
  minPlayers: positiveInteger,
  maxPlayers: positiveInteger,
  minPlayTime: positiveInteger,
  maxPlayTime: positiveInteger,
  averagePlayTime: positiveInteger.nullable(),
  complexity: z.number().finite().positive().max(99.99).nullable(),
  complexityScale: text.nullable(),
  koreanEdition: z.enum(["UNKNOWN", "CONFIRMED", "NOT_AVAILABLE"]),
  domesticAvailability: z.enum(["UNKNOWN", "LISTED", "IN_STOCK", "OUT_OF_STOCK"]),
  domesticPlayStatus: z.enum(["UNKNOWN", "CONFIRMED"]),
  domesticPopularityStatus: z.enum(["UNKNOWN", "CONFIRMED"]),
  verificationStatus: verificationStatusSchema,
  lastVerifiedAt: timestamp.nullable(),
}).superRefine((game, context) => {
  if (game.minPlayers > game.maxPlayers) {
    context.addIssue({ code: "custom", path: ["maxPlayers"], message: "최대 인원은 최소 인원 이상이어야 합니다." });
  }
  if (game.minPlayTime > game.maxPlayTime) {
    context.addIssue({ code: "custom", path: ["maxPlayTime"], message: "최대 시간은 최소 시간 이상이어야 합니다." });
  }
  if (game.averagePlayTime !== null &&
      (game.averagePlayTime < game.minPlayTime || game.averagePlayTime > game.maxPlayTime)) {
    context.addIssue({ code: "custom", path: ["averagePlayTime"], message: "평균 시간은 출처 시간 범위 안에 있어야 합니다." });
  }
  if ((game.complexity === null) !== (game.complexityScale === null)) {
    context.addIssue({ code: "custom", path: ["complexity"], message: "복잡도 값과 원자료 척도를 함께 기록해 주세요." });
  }
  if (game.verificationStatus === "VERIFIED" && game.lastVerifiedAt === null) {
    context.addIssue({ code: "custom", path: ["lastVerifiedAt"], message: "검증 날짜가 필요합니다." });
  }
});

export const gameEditorialSchema = z.strictObject({
  bestPlayers: uniqueIntegers,
  categories: uniqueTexts,
  mechanics: uniqueTexts,
  moodTags: z.array(moodTagSchema).refine((values) => new Set(values).size === values.length),
  difficulty: z.enum(["BEGINNER", "EASY", "INTERMEDIATE", "ADVANCED"]).nullable(),
  languageDependency: languageDependencySchema,
  descriptionKo: text.nullable(),
  setupKo: text.nullable(),
  howToPlayKo: text.nullable(),
  victoryKo: text.nullable(),
  recommendedForKo: text.nullable(),
  cautionsKo: text.nullable(),
  rationaleKo: text,
  author: text,
  verificationStatus: verificationStatusSchema,
  reviewedAt: timestamp.nullable(),
}).refine((editorial) => editorial.verificationStatus !== "VERIFIED" || editorial.reviewedAt !== null,
  { path: ["reviewedAt"], message: "편집 검토 날짜가 필요합니다." });

const factFieldSchema = z.enum([
  "nameKo", "nameEn", "editionNote", "minPlayers", "maxPlayers", "minPlayTime", "maxPlayTime",
  "averagePlayTime", "complexity", "complexityScale", "koreanEdition", "domesticAvailability",
  "domesticPlayStatus", "domesticPopularityStatus",
]);

const observedFactsSchema = z.strictObject(gameFactsSchema.shape).omit({
  slug: true, verificationStatus: true, lastVerifiedAt: true,
}).partial();

const sourceSchema = z.strictObject({
  sourceName: text,
  sourceUrl: webUrl,
  sourceType: z.enum(["DOMESTIC_DISTRIBUTOR", "PUBLISHER", "PUBLIC_DATA", "BGG"]),
  verifiedAt: timestamp,
  observations: z.array(z.strictObject({
    verifiedAt: timestamp,
    verificationStatus: verificationStatusSchema,
    checkedFields: z.array(factFieldSchema).min(1).refine((values) => new Set(values).size === values.length),
    observedFacts: observedFactsSchema,
    collectionMethod: z.enum(["MANUAL_REVIEW", "PERMITTED_FILE"]),
    reviewedBy: text,
    evidenceNoteKo: text,
    usageStatus: z.enum(["FACTS_ONLY", "PERMISSION_GRANTED", "OPEN_LICENSE", "UNCONFIRMED"]),
    usageNoteKo: text,
  })).min(1),
}).superRefine((source, context) => {
  const dates = source.observations.map((observation) => Date.parse(observation.verifiedAt));
  if (new Set(dates).size !== dates.length || Date.parse(source.verifiedAt) !== Math.max(...dates)) {
    context.addIssue({ code: "custom", path: ["verifiedAt"], message: "출처 확인일은 중복 없는 최신 관측일이어야 합니다." });
  }
});

export const boardGameRecordSchema = z.strictObject({
  facts: gameFactsSchema,
  editorial: gameEditorialSchema.nullable(),
  sources: z.array(sourceSchema),
  externalIds: z.array(z.strictObject({ provider: text, externalId: text })),
}).superRefine((record, context) => {
  const { facts, editorial, sources } = record;
  if (editorial?.bestPlayers.some((count) => count < facts.minPlayers || count > facts.maxPlayers)) {
    context.addIssue({ code: "custom", path: ["editorial", "bestPlayers"], message: "추천 인원이 플레이 가능 범위를 벗어났습니다." });
  }
  if (new Set(sources.map((source) => source.sourceUrl)).size !== sources.length) {
    context.addIssue({ code: "custom", path: ["sources"], message: "출처 URL이 중복되었습니다." });
  }
  if (new Set(record.externalIds.map((external) => external.provider)).size !== record.externalIds.length) {
    context.addIssue({ code: "custom", path: ["externalIds"], message: "게임별 외부 제공자 ID는 하나만 허용합니다." });
  }
  if (facts.verificationStatus !== "VERIFIED") return;

  const requiredFields: z.infer<typeof factFieldSchema>[] = [
    "nameKo", "editionNote", "minPlayers", "maxPlayers", "minPlayTime", "maxPlayTime",
  ];
  if (facts.nameEn !== null) requiredFields.push("nameEn");
  if (facts.koreanEdition !== "UNKNOWN") requiredFields.push("koreanEdition");
  if (facts.domesticAvailability !== "UNKNOWN") requiredFields.push("domesticAvailability");
  if (facts.domesticPlayStatus !== "UNKNOWN") requiredFields.push("domesticPlayStatus");
  if (facts.domesticPopularityStatus !== "UNKNOWN") requiredFields.push("domesticPopularityStatus");
  if (facts.averagePlayTime !== null) requiredFields.push("averagePlayTime");
  if (facts.complexity !== null) requiredFields.push("complexity", "complexityScale");

  const observations = sources.flatMap((source) => source.observations.filter(
    (observation) => Date.parse(observation.verifiedAt) === Date.parse(source.verifiedAt),
  )).filter(
    (observation) => observation.verificationStatus === "VERIFIED" && observation.usageStatus !== "UNCONFIRMED",
  );
  if (requiredFields.some((field) => !observations.some((observation) =>
    observation.checkedFields.includes(field) && observation.observedFacts[field] === facts[field],
  ))) {
    context.addIssue({ code: "custom", path: ["sources"], message: "검증된 사실의 필드별 출처와 이용 근거가 필요합니다." });
  }
  const lastVerifiedAt = facts.lastVerifiedAt;
  if (lastVerifiedAt !== null && !observations.some(
    (observation) => Date.parse(observation.verifiedAt) === Date.parse(lastVerifiedAt),
  )) {
    context.addIssue({ code: "custom", path: ["facts", "lastVerifiedAt"], message: "게임 확인일에 대응하는 검증 관측이 필요합니다." });
  }
});

export const gameDatasetSchema = z.array(boardGameRecordSchema).superRefine((records, context) => {
  const slugs = new Set<string>();
  const externalIds = new Set<string>();
  records.forEach((record, index) => {
    if (slugs.has(record.facts.slug)) {
      context.addIssue({ code: "custom", path: [index, "facts", "slug"], message: "게임 slug가 중복되었습니다." });
    }
    slugs.add(record.facts.slug);
    for (const external of record.externalIds) {
      const key = JSON.stringify([external.provider, external.externalId]);
      if (externalIds.has(key)) {
        context.addIssue({ code: "custom", path: [index, "externalIds"], message: "외부 ID가 여러 게임에 중복되었습니다." });
      }
      externalIds.add(key);
    }
  });
});

export type BoardGameRecord = z.infer<typeof boardGameRecordSchema>;
