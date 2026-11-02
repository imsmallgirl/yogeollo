import { createHash } from "node:crypto";
import type { BoardGameRecord } from "../games/schema";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  throw new Error("JSON으로 표현할 수 없는 값입니다.");
}

export function contentDigest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

const iso = (value: string) => new Date(value).toISOString();
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;

/** Bind publication to public facts, verified editorial, identity and provenance, not DB IDs. */
export function publicationDigest(record: BoardGameRecord): string {
  return contentDigest({
    facts: { ...record.facts, lastVerifiedAt: record.facts.lastVerifiedAt ? iso(record.facts.lastVerifiedAt) : null },
    editorial: record.editorial?.verificationStatus === "VERIFIED" ? {
      ...record.editorial, reviewedAt: record.editorial.reviewedAt ? iso(record.editorial.reviewedAt) : null,
    } : null,
    sources: record.sources.map((source) => ({
      ...source, verifiedAt: iso(source.verifiedAt),
      observations: source.observations.map((observation) => ({
        ...observation, verifiedAt: iso(observation.verifiedAt), checkedFields: [...observation.checkedFields].sort(),
      })).sort((left, right) => compare(left.verifiedAt, right.verifiedAt)),
    })).sort((left, right) => compare(left.sourceUrl, right.sourceUrl)),
    externalIds: [...record.externalIds].sort((left, right) => compare(left.provider, right.provider) || compare(left.externalId, right.externalId)),
  });
}
