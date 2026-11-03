import { GamePhoto } from "./game-photo";
import { BookOpen, ExternalLink } from "lucide-react";
import { formatKoreanDate } from "@/lib/format-date";
import { Notice } from "@/components/ui/notice";
import { difficultyLabels, moodLabels } from "@/domain/recommendation/preferences";
import { formatPlayTime } from "@/domain/recommendation/time";
import type { GameGuide } from "@/domain/games/guide";
import type { RecommendationGame, VerifiedEditorial } from "@/domain/recommendation/types";

export function GameDetailContent({ game, editorial, guide, preview }: {
  game: RecommendationGame; editorial: VerifiedEditorial | null; guide: GameGuide | null; preview: boolean;
}) {
  const facts = game.facts;
  const sections = [
    { title: "준비 방법", lines: guide?.setup ?? (editorial?.setupKo ? [editorial.setupKo] : []) },
    { title: "기본 진행 방법", lines: guide?.play ?? (editorial?.howToPlayKo ? [editorial.howToPlayKo] : []) },
    { title: "승리 조건", lines: guide?.victory ?? (editorial?.victoryKo ? [editorial.victoryKo] : []) },
    { title: "추천 대상", lines: guide?.recommendedFor ?? (editorial?.recommendedForKo ? [editorial.recommendedForKo] : []) },
    { title: "주의할 점", lines: guide?.cautions ?? (editorial?.cautionsKo ? [editorial.cautionsKo] : []) },
  ];
  const details = [
    { label: "플레이 인원", value: facts.minPlayers === facts.maxPlayers ? `${facts.minPlayers}명` : `${facts.minPlayers}~${facts.maxPlayers}명` },
    { label: "권장 인원", value: editorial?.bestPlayers.length ? `${editorial.bestPlayers.join("·")}명` : "아직 확인 중" },
    { label: "표기 시간", value: formatPlayTime(facts.minPlayTime, facts.maxPlayTime) },
    { label: "난이도", value: editorial?.difficulty ? difficultyLabels[editorial.difficulty] : "아직 확인 중" },
    { label: "게임 분위기", value: editorial?.moodTags.length ? editorial.moodTags.map((tag) => moodLabels[tag]).join(" · ") : "아직 확인 중" },
  ];
  return <>
    <div className="mb-7"><p className="mb-3 text-sm font-semibold text-primary">한 판을 시작하기 전에</p><h1 className="break-words text-4xl font-extrabold tracking-tight">{facts.nameKo}</h1>{facts.nameEn && <p className="mt-2 text-sm text-muted-foreground">{facts.nameEn}</p>}</div>
    {preview && <Notice title="미리보기 · 자체 작성 요약 초안">{guide ? "공식 자료를 대조해 직접 작성한 핵심 요약이에요. 사람의 편집 검토와 한국 유통 판본 대조는 아직 완료하지 않았어요." : "게임 정보를 추가로 확인하고 있어요. 미확인 정보는 추정하지 않았어요."}</Notice>}
    <GamePhoto slug={facts.slug} detail />
    <section aria-labelledby="overview-title" className="mt-7 rounded-3xl border border-border bg-white/75 p-5 sm:p-8"><h2 id="overview-title" className="text-xl font-bold">어떤 게임인가요?</h2><p className="mt-4 text-sm leading-8 text-muted-foreground">{guide?.introduction ?? editorial?.descriptionKo ?? "게임 소개를 확인하고 있어요."}</p><dl className="mt-6 grid grid-cols-2 gap-5 rounded-2xl bg-background p-5 sm:grid-cols-3">{details.map(({ label, value }) => <div key={label} className="min-w-0"><dt className="mb-1 text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-semibold leading-7">{value}</dd></div>)}</dl><p className="mt-5 text-xs leading-6 text-muted-foreground">{facts.editionNote}</p></section>
    <div className="mt-7 grid gap-5 md:grid-cols-2">{sections.map(({ title, lines }, index) => <section key={title} className={`rounded-3xl border border-border bg-white/75 p-5 sm:p-7 ${title === "기본 진행 방법" ? "md:row-span-2" : ""}`}><h2 className="flex items-center gap-3 text-lg font-bold"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{title}</h2>{lines.length ? <ol className="mt-4 space-y-3">{lines.map((line, lineIndex) => <li key={line} className="text-sm leading-8 text-muted-foreground">{lines.length > 1 && <span className="mr-2 font-semibold text-primary">{lineIndex + 1}.</span>}{line}</li>)}</ol> : <p className="mt-4 text-sm leading-8 text-muted-foreground">설명을 확인하고 있어요.</p>}</section>)}</div>
    <section aria-labelledby="sources-title" className="mt-7 rounded-3xl border border-border p-5 sm:p-7"><h2 id="sources-title" className="flex items-center gap-2 text-lg font-bold"><BookOpen aria-hidden="true" className="size-5 text-primary" />출처와 작성 정보</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{guide ? `${guide.author} · 작성일 ${formatKoreanDate(guide.authoredAt)} ${guide.edition}` : "아래 자료에서 확인한 게임 정보와 별도로 검토한 자체 편집만 표시해요."}</p><ul className="mt-4 space-y-3">{game.sources.map((source) => <li key={source.sourceUrl} className="text-sm leading-7"><a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all font-semibold text-primary underline underline-offset-4">{source.sourceName}<ExternalLink aria-hidden="true" className="size-3.5 shrink-0" /><span className="sr-only">새 창</span></a><p className="text-xs text-muted-foreground">확인일 {formatKoreanDate(source.verifiedAt)} · 판매 재고나 국내 인기를 보장하는 자료는 아니에요.</p></li>)}{guide?.sources.map((source) => <li key={source.url} className="text-sm leading-7"><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all font-semibold text-primary underline underline-offset-4">{source.name}<ExternalLink aria-hidden="true" className="size-3.5 shrink-0" /><span className="sr-only">새 창</span></a><p className="text-xs text-muted-foreground">{source.pages} · 확인일 {formatKoreanDate(source.checkedAt)} · 원문 대신 자체 요약을 제공해요.</p></li>)}</ul></section>
  </>;
}
