import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/recommendation/empty-state";
import { GameCard } from "@/components/recommendation/game-card";
import { PreferenceSummary } from "@/components/recommendation/preference-summary";
import { Notice } from "@/components/ui/notice";
import { buttonVariants } from "@/components/ui/button";
import { editRecommendationHref } from "@/domain/recommendation/query";
import { getRecommendationPageData } from "@/server/recommendation";
export const metadata: Metadata = { title: "우리 모임 추천 결과", robots: { index: false, follow: false } };
export default async function RecommendPage({ searchParams }: PageProps<"/recommend">) {
  const data = await getRecommendationPageData(await searchParams);
  if (data.status === "invalid") return <main id="main" className="mx-auto max-w-6xl space-y-6 px-5 py-12 sm:px-8"><h1 className="text-3xl font-bold">추천 조건을 확인해 주세요</h1><Notice title="조건을 다시 선택해 주세요" role="alert">{data.message}<ul>{Object.values(data.errors).map((error) => <li key={error}>{error}</li>)}</ul></Notice><Link href="/#find-game" className={buttonVariants()}>조건 선택으로 돌아가기</Link></main>;
  const preferences = data.status === "ready" ? data.result.preferences : data.preferences;
  const editHref = editRecommendationHref(preferences);
  return <main id="main" className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
    <Link href={editHref} className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"><ArrowLeft aria-hidden="true" className="size-4" />모임 조건 다시 고르기</Link>
    <div className="mb-7"><p className="mb-3 text-sm font-semibold text-primary">오늘의 한 판을 위한 선택</p><h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">오늘 우리 모임,<br className="sm:hidden" /> 이 게임 어때요?</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">인원과 시간을 먼저 확인하고, 모임의 취향에 맞춰 살펴봐요.</p></div>
    <PreferenceSummary preferences={preferences} />
    <div className="mt-8 space-y-5">
      {data.status === "pending" && <EmptyState title="게임 정보를 꼼꼼히 확인하고 있어요" description="출처와 이용 범위를 확인한 게임부터 추천해 드리려고 해요. 선택한 조건은 유지했어요. 게임이 준비되면 이 주소로 다시 찾아주세요." href={editHref} action="조건 다시 살펴보기" />}
      {data.status === "unavailable" && <EmptyState title="지금은 게임을 불러올 수 없어요" description="잠시 후 같은 주소에서 다시 시도해 주세요. 선택한 조건은 그대로 유지했어요." href={editHref} action="조건으로 돌아가기" />}
      {data.status === "ready" && <>
        {data.preview && <Notice title="미리보기 결과예요">현재 {data.catalogSize}개 게임으로 추천 흐름을 살펴보고 있어요. 게임 정보의 추가 확인을 준비하고 있으며, 모르는 정보는 채워 넣지 않았어요.</Notice>}
        {data.result.relaxations.map((relaxation) => <Notice key={relaxation.code} title="시간 조건을 일부 완화했어요">{relaxation.message}</Notice>)}
        {data.result.recommendations.length === 0 ? <EmptyState title="지금 조건에 맞는 게임을 찾지 못했어요" description="인원과 검증 조건은 그대로 유지했어요. 시간을 바꾸거나 다른 모임 조건으로 다시 살펴보세요." href={editHref} action="조건 바꿔서 다시 찾기" /> : <>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3"><p className="text-lg font-bold">우리 모임의 후보 <span className="text-primary">{data.result.recommendations.length}개</span></p><Link href={editHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground"><SlidersHorizontal aria-hidden="true" className="size-4" />조건 바꾸기</Link></div>
          {data.result.notices.filter((notice) => !notice.startsWith("시간 조건")).map((notice) => <p key={notice} role="status" className="text-sm leading-7 text-muted-foreground">{notice}</p>)}
          <section aria-label="추천 게임" className="space-y-5">{data.result.recommendations.map((recommendation, index) => <GameCard key={recommendation.game.slug} recommendation={recommendation} rank={index + 1} />)}</section>
        </>}
      </>}
    </div>
  </main>;
}
