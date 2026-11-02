import { z } from "zod";

export const rouletteCandidatesSchema = z.array(z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nameKo: z.string().trim().min(1),
})).max(5).refine((items) => new Set(items.map((item) => item.slug)).size === items.length);
export type RouletteCandidate = z.infer<typeof rouletteCandidatesSchema>[number];

/** An injected uint32 source keeps selection testable without bias from modulo. */
export function chooseRouletteIndex(count: number, nextUint32: () => number): number {
  if (!Number.isInteger(count) || count < 1 || count > 5) throw new Error("후보를 1~5개 선택해 주세요.");
  if (count === 1) return 0;
  const range = 2 ** 32;
  const acceptedRange = range - range % count;
  for (let attempt = 0; attempt < 128; attempt++) {
    const value = nextUint32();
    if (!Number.isInteger(value) || value < 0 || value >= range) throw new Error("무작위 값을 확인할 수 없어요.");
    if (value < acceptedRange) return value % count;
  }
  throw new Error("무작위 선택을 다시 시도해 주세요.");
}

/** A clockwise wheel with its pointer fixed at twelve o'clock. */
export function rouletteEndRotation(current: number, index: number, count: number): number {
  if (!Number.isFinite(current) || current < 0 || !Number.isInteger(count) || count < 1 || count > 5 ||
    !Number.isInteger(index) || index < 0 || index >= count) throw new Error("룰렛 위치를 확인할 수 없어요.");
  const target = (360 - (index + 0.5) * 360 / count) % 360;
  const offset = (target - current % 360 + 360) % 360;
  return current + 360 * 5 + offset;
}

export function selectedRouletteCandidates(candidates: readonly RouletteCandidate[], selected: readonly string[]) {
  const selectedSlugs = new Set(selected);
  return candidates.filter((candidate) => selectedSlugs.has(candidate.slug));
}
