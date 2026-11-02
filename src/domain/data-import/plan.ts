import type { BoardGameRecord } from "../games/schema";
import { canonicalJson } from "./digest";
import type { ImportPackage, ImportPlan, ImportIssue } from "./schema";

const normalizedName = (name: string) => name.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
const provider = (name: string) => name.trim().toLowerCase();
const sameDate = (left: string, right: string) => Date.parse(left) === Date.parse(right);

function comparableObservation(observation: BoardGameRecord["sources"][number]["observations"][number]) {
  return { ...observation, verifiedAt: new Date(observation.verifiedAt).toISOString(), checkedFields: [...observation.checkedFields].sort() };
}

export function planImport(payload: ImportPackage, existing: readonly BoardGameRecord[], asOf: string): ImportPlan {
  const issues: ImportIssue[] = [];
  const now = Date.parse(asOf);
  if (!Number.isFinite(now)) throw new Error("검사 기준일이 필요합니다.");
  const issue = (code: string, slug: string | null, message: string) => issues.push({ code, slug, message });
  if (payload.acquisition.permissionStatus !== "CONFIRMED") issue("PERMISSION_UNCONFIRMED", null, "수집·파일 이용 근거를 확인한 뒤 새 revision으로 다시 제출해야 합니다.");
  if (Date.parse(payload.collectedAt) > now) issue("FUTURE_DATE", null, "수집일은 검사 기준일보다 미래일 수 없습니다.");

  const changes = payload.games.map((game) => {
    const slug = game.facts.slug;
    const current = existing.find((record) => record.facts.slug === slug);
    if (game.facts.verificationStatus !== "VERIFIED") issue("UNVERIFIED_FACTS", slug, "출처를 대조한 VERIFIED 사실만 반영할 수 있습니다.");
    const bgg = game.sources.some((source) => source.sourceType === "BGG" || /(^|\.)boardgamegeek\.com$/i.test(new URL(source.sourceUrl).hostname)) ||
      game.externalIds.some((external) => /^(bgg|boardgamegeek)(com)?$/.test(provider(external.provider).replace(/[\s._-]/g, "")));
    if (bgg) issue("BGG_DISABLED", slug, "BGG 애플리케이션 승인·이용 조건이 확인되지 않아 가져오기를 지원하지 않습니다.");
    if (current && ["nameKo", "nameEn", "editionNote"].some((field) => current.facts[field as "nameKo" | "nameEn" | "editionNote"] !== game.facts[field as "nameKo" | "nameEn" | "editionNote"])) {
      issue("EDITION_CONFLICT", slug, "같은 slug의 이름·판본 정보가 달라 자동 병합하지 않습니다.");
    }
    const names = [game.facts.nameKo, game.facts.nameEn].filter((name): name is string => name !== null).map(normalizedName);
    for (const other of [...existing, ...payload.games]) {
      if (other.facts.slug !== slug && [other.facts.nameKo, other.facts.nameEn].some((name) => name !== null && names.includes(normalizedName(name)))) {
        issue("IDENTITY_COLLISION", slug, "다른 slug와 이름이 겹칩니다. 판본·별칭을 수동 확인해야 합니다.");
        break;
      }
    }
    if (current?.editorial?.bestPlayers.some((count) => count < game.facts.minPlayers || count > game.facts.maxPlayers)) {
      issue("EDITORIAL_CONFLICT", slug, "기존 자체 추천 인원이 새 가능 인원 범위를 벗어납니다. 자체 편집은 자동 변경하지 않습니다.");
    }
    let addedSources = 0;
    let addedObservations = 0;
    for (const source of game.sources) {
      const previous = current?.sources.find((item) => item.sourceUrl === source.sourceUrl);
      if (!previous) addedSources++;
      if (previous && (previous.sourceName !== source.sourceName || previous.sourceType !== source.sourceType)) issue("SOURCE_IDENTITY_CONFLICT", slug, "기존 출처의 이름·타입은 덮어쓸 수 없습니다.");
      if (previous && Date.parse(source.verifiedAt) < Date.parse(previous.verifiedAt)) issue("STALE_SOURCE", slug, "기존 출처보다 오래된 확인일로 최신 상태를 덮어쓸 수 없습니다.");
      for (const observation of source.observations) {
        if (Date.parse(observation.verifiedAt) > now) issue("FUTURE_DATE", slug, "관측일은 검사 기준일보다 미래일 수 없습니다.");
        if (observation.usageStatus === "UNCONFIRMED") issue("SOURCE_USAGE_UNCONFIRMED", slug, "출처 관측의 이용 범위를 확인해야 합니다.");
        const older = previous?.observations.find((item) => sameDate(item.verifiedAt, observation.verifiedAt));
        if (!older) addedObservations++;
        else if (canonicalJson(comparableObservation(older)) !== canonicalJson(comparableObservation(observation))) issue("OBSERVATION_CONFLICT", slug, "같은 출처·확인일의 관측은 수정할 수 없습니다. 새 관측으로 기록해야 합니다.");
      }
    }
    let addedExternalIds = 0;
    for (const external of game.externalIds) {
      const previous = current?.externalIds.find((item) => provider(item.provider) === provider(external.provider));
      if (!previous) addedExternalIds++;
      else if (previous.externalId !== external.externalId) issue("EXTERNAL_ID_CONFLICT", slug, "기존 제공자 ID와 달라 판본을 확인해야 합니다.");
      if (existing.some((item) => item.facts.slug !== slug && item.externalIds.some((id) => provider(id.provider) === provider(external.provider) && id.externalId === external.externalId))) issue("EXTERNAL_ID_CONFLICT", slug, "외부 ID가 다른 게임에 연결돼 있습니다.");
    }
    const changedFields = Object.keys(game.facts).filter((field) => {
      const key = field as keyof typeof game.facts;
      const left = current?.facts[key];
      const right = game.facts[key];
      return key === "lastVerifiedAt" && typeof left === "string" && typeof right === "string" ? !sameDate(left, right) : left !== right;
    });
    return { slug, action: !current ? "CREATE" as const : changedFields.length || addedSources || addedObservations || addedExternalIds ? "UPDATE" as const : "NOOP" as const, changedFields, addedSources, addedObservations, addedExternalIds };
  });
  return { changes, issues };
}
