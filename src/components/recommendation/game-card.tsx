import { Check, ChevronDown, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { difficultyLabels } from "@/domain/recommendation/preferences";
import { formatPlayTime } from "@/domain/recommendation/time";
import type { Recommendation, RecommendationExplanation } from "@/domain/recommendation/types";
function Reason({ reason }: { reason: RecommendationExplanation }) {
  const Icon = reason.kind === "MATCH" ? Check : reason.kind === "CAUTION" ? TriangleAlert : Info;
  return <li className="flex gap-2.5 text-sm leading-7"><Icon aria-hidden="true" className="mt-1.5 size-3.5 shrink-0 text-primary" /><span>{reason.message}</span></li>;
}
export function GameCard({ recommendation, rank }: { recommendation: Recommendation; rank: number }) {
  const { game, reasons, relaxation } = recommendation;
  const shown = reasons.filter((reason) => reason.kind !== "INFO" && !(relaxation && reason.code === "TIME"));
  const information = reasons.filter((reason) => reason.kind === "INFO");
  const facts = [
    { label: "플레이 인원", value: game.minPlayers === game.maxPlayers ? `${game.minPlayers}명` : `${game.minPlayers}~${game.maxPlayers}명` },
    { label: "추천 인원", value: game.bestPlayers.length ? `${game.bestPlayers.join("·")}명` : "아직 확인 중" },
    { label: game.averagePlayTime === null ? "표기 시간" : "평균 시간", value: game.averagePlayTime === null ? formatPlayTime(game.minPlayTime, game.maxPlayTime) : `${game.averagePlayTime}분 (표기 ${formatPlayTime(game.minPlayTime, game.maxPlayTime)})` },
    { label: "난이도", value: game.difficulty ? difficultyLabels[game.difficulty] : "아직 확인 중" },
    { label: "장르", value: game.categories.length ? game.categories.join(" · ") : "아직 확인 중" },
  ];
  return <article aria-labelledby={`game-${game.slug}`} className="overflow-hidden rounded-3xl border border-border bg-white/80">
    <div className="p-5 sm:p-8">
      <div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">{String(rank).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-semibold text-primary">우리 모임의 선택지</p><h2 id={`game-${game.slug}`} className="break-words text-2xl font-bold tracking-tight">{game.nameKo}</h2>{game.nameEn && <p className="mt-1 text-xs text-muted-foreground">{game.nameEn}</p>}</div><span className="hidden rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground sm:block">{game.domesticAvailability === "IN_STOCK" ? "국내 판매 확인" : game.domesticAvailability === "UNKNOWN" ? "국내 플레이 근거 확인" : "국내 상품 확인"}</span></div>
      {game.descriptionKo && <p className="mt-5 text-sm leading-7 text-muted-foreground">{game.descriptionKo}</p>}
      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 rounded-2xl bg-background p-5 sm:grid-cols-3 lg:grid-cols-5">{facts.map(({ label, value }) => <div key={label} className="min-w-0"><dt className="mb-1 text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-semibold leading-6">{value}</dd></div>)}</dl>
      {relaxation && <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-7"><p className="font-semibold text-primary">시간 조건을 완화한 게임이에요</p><p className="mt-1">{relaxation.message}</p></div>}
      <div className="mt-6"><h3 className="mb-2 text-sm font-bold">이 게임을 고른 이유</h3><ul className="space-y-1.5">{shown.map((reason) => <Reason key={reason.code} reason={reason} />)}</ul></div>
      {information.length > 0 && <details className="group mt-5 border-t border-border pt-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring">함께 확인할 정보 {information.length}개<ChevronDown aria-hidden="true" className="size-4 shrink-0 group-open:rotate-180" /></summary><ul className="mt-2 space-y-2 text-muted-foreground">{information.map((reason) => <Reason key={reason.code} reason={reason} />)}</ul></details>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/60 px-5 py-4 sm:px-8"><p className="text-xs leading-6 text-muted-foreground">가능 인원과 자체 추천 인원은 다를 수 있어요.</p><Button variant="outline" disabled className="text-xs">상세 소개 준비 중</Button></div>
  </article>;
}
