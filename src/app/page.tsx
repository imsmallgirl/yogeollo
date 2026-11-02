import { ArrowDown, Check, Clock3, Dices, HeartHandshake, Users } from "lucide-react";
import { RecommendationForm } from "@/components/recommendation/recommendation-form";
import { Notice } from "@/components/ui/notice";
import { defaultPreferences, parseRecommendationQuery, recommendationQuery } from "@/domain/recommendation/query";
import { catalogMode } from "@/server/catalog";

export default async function Home({ searchParams }: PageProps<"/">) {
  const query = await searchParams;
  const parsed = Object.keys(query).length ? parseRecommendationQuery(query) : null;
  const preferences = parsed?.success ? parsed.preferences : defaultPreferences;
  return <main id="main" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
    <section className="relative grid gap-10 pb-12 pt-10 lg:grid-cols-[1fr_300px] lg:items-center lg:py-16">
      <div><p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><span className="size-2 rounded-full bg-primary" />고민은 짧게, 한 판은 즐겁게</p>
        <h1 className="text-[2.5rem] leading-[1.2] font-extrabold tracking-tight sm:text-6xl">오늘 우리 모임,<br /><span className="text-primary">무슨 게임 할까?</span></h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">인원도, 시간도, 취향도 제각각이니까.<br />지금 함께하는 사람들에게 어울리는 한 판을 골라요.</p>
        <a href="#find-game" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">우리 모임에 맞춰 찾기<ArrowDown aria-hidden="true" className="size-4" /></a>
      </div>
      <div aria-hidden="true" className="relative hidden h-64 items-center justify-center lg:flex"><div className="absolute size-60 rounded-full border border-border" /><div className="absolute size-44 rounded-full bg-muted" /><div className="absolute left-3 top-14 flex h-36 w-24 -rotate-12 items-center justify-center rounded-2xl border-2 border-foreground/10 bg-primary text-white shadow-sm"><Dices className="size-14" strokeWidth={1.4} /></div><div className="absolute right-8 top-9 flex h-40 w-28 rotate-12 items-center justify-center rounded-2xl border-2 border-border bg-white text-primary shadow-sm"><HeartHandshake className="size-14" strokeWidth={1.4} /></div><span className="absolute bottom-3 right-10 rotate-6 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">오늘은, 요걸로!</span></div>
    </section>
    <section id="find-game" aria-labelledby="form-title" className="scroll-mt-6 rounded-3xl border border-border bg-white/75 p-5 shadow-[0_8px_40px_-24px_#70604b] sm:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-6"><div><p className="mb-2 text-xs font-semibold tracking-widest text-primary">오늘의 모임</p><h2 id="form-title" className="text-2xl font-bold tracking-tight">우리 모임에 맞춰 골라요</h2></div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="size-3.5" />네 가지만 선택하면 돼요</p></div>
      {catalogMode() === "preview" && <Notice title="미리보기로 먼저 만나보세요" className="mb-8 bg-background">현재는 소량의 게임으로 추천 흐름을 살펴볼 수 있어요. 게임 정보는 추가 확인 중이며, 선택한 조건에 따라 결과가 없을 수 있어요.</Notice>}
      <RecommendationForm key={recommendationQuery(preferences)} initialPreferences={preferences} initialError={parsed && !parsed.success ? parsed.message : undefined} />
    </section>
    <section aria-labelledby="how-title" className="pt-14"><h2 id="how-title" className="mb-7 text-lg font-bold">이유를 알고 고르는 한 판</h2><div className="grid gap-7 sm:grid-cols-3">{[
      { Icon: Users, title: "우리 인원에 맞게", description: "플레이 가능한 인원부터 확인해요. 7명 이상도 정확한 인원수로 찾아요." },
      { Icon: Clock3, title: "시간이 달라지면 솔직하게", description: "조건을 완화한 게임은 실제 표기 시간과 달라진 점을 함께 알려드려요." },
      { Icon: Check, title: "추천한 이유까지 함께", description: "확인한 정보와 아직 모르는 정보를 구분해, 선택을 도와드려요." },
    ].map(({ Icon, title, description }) => <article key={title} className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><Icon aria-hidden="true" className="size-5" /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p></div></article>)}</div></section>
  </main>;
}
