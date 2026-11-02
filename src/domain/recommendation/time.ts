import { playTimeOptions, type PlayTime } from "./preferences";
import type { TimeMatch, TimeRelaxation } from "./types";

function timeWindow(playTime: PlayTime) {
  const index = playTimeOptions.findIndex((option) => option.value === playTime);
  // Callers validate PlayTime before reaching this helper.
  if (index < 0) throw new Error("알 수 없는 시간 구간입니다.");
  return { index, selected: playTimeOptions[index] };
}

/** All intervals are closed. A missing upper bound means no maximum. */
export function classifyPlayTime(min: number, max: number, playTime: PlayTime): TimeMatch | null {
  const { index, selected } = timeWindow(playTime);
  const upper = selected.maxMinutes ?? Infinity;
  if (min >= selected.minMinutes && max <= upper) return "STRICT";

  const left = playTimeOptions[index - 1] ?? selected;
  const right = playTimeOptions[index + 1] ?? selected;
  // Even overlapping ranges cannot extend beyond the immediate-neighbor envelope.
  if (min < left.minMinutes || max > (right.maxMinutes ?? Infinity)) return null;
  if (min <= upper && max >= selected.minMinutes) return "OVERLAPPING_TIME";

  const inNeighbor = [playTimeOptions[index - 1], playTimeOptions[index + 1]].some(
    (neighbor) => neighbor !== undefined && min >= neighbor.minMinutes && max <= (neighbor.maxMinutes ?? Infinity),
  );
  return inNeighbor ? "ADJACENT_TIME" : null;
}

export function formatPlayTime(min: number, max: number): string {
  return min === max ? `${min}분` : `${min}~${max}분`;
}

export function explainTimeRelaxation(
  min: number,
  max: number,
  playTime: PlayTime,
  match: TimeMatch,
): TimeRelaxation | null {
  if (match === "STRICT") return null;
  const { selected } = timeWindow(playTime);
  const differences: string[] = [];
  if (min < selected.minMinutes) differences.push("선택보다 짧게 끝날 수 있어요.");
  if (selected.maxMinutes !== null && max > selected.maxMinutes) differences.push("선택보다 오래 걸릴 수 있어요.");
  const relation = match === "OVERLAPPING_TIME" ? "일부만 겹쳐요" : "인접한 시간 구간이에요";
  return {
    code: match,
    message: `선택한 시간(${selected.label})과 ${relation}. 게임 표기 시간은 ${formatPlayTime(min, max)}이에요. ${differences.join(" ")}`.trim(),
  };
}
