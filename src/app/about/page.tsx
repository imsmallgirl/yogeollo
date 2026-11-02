import type { Metadata } from "next";
import Link from "next/link";
import { Check, Dices, HeartHandshake, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "요걸로 소개", description: "우리 모임에 맞는 보드게임을 고르는 요걸로의 추천 기준과 데이터 원칙을 소개합니다." };

export default function AboutPage() {
  return <main id="main" className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:px-8"><p className="mb-4 text-sm font-semibold text-primary">우리 모임의 다음 한 판</p><h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">고민하는 시간은 줄이고,<br /><span className="text-primary">함께 노는 시간은 늘려요.</span></h1><p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground">요걸로는 지금 모인 사람들에게 어울리는 보드게임을 고르는 서비스예요. 인원, 시간, 분위기, 난이도 네 가지로 오늘의 선택지를 찾아드려요.</p>
    <div className="mt-10 space-y-5">{[
      { Icon: Check, title: "왜 추천했는지 설명해요", body: "플레이 가능한 인원과 시간을 먼저 확인해요. 그 안에서 추천 인원, 분위기, 난이도, 한국어 사용 편의와 다양성을 살펴요. 근거 없는 적합도 백분율은 만들지 않아요." },
      { Icon: ShieldCheck, title: "모르는 정보는 모른다고 해요", body: "국내 상품 노출과 재고, 국내 플레이 근거와 인기는 구분해요. 확인하지 못한 난이도나 평균 시간은 추정하지 않아요. 게임을 5개 채우려고 정보를 만들어 넣지 않아요." },
      { Icon: HeartHandshake, title: "조건이 달라지면 알려드려요", body: "결과가 부족하면 인접한 시간 구간까지만 살펴보고, 어떤 시간이 달라졌는지 표시해요. 인원과 검증 조건은 완화하지 않아요. 분위기나 난이도가 다른 경우도 솔직하게 설명해요." },
      { Icon: Dices, title: "마지막 고민은 룰렛으로", body: "추천 결과 중 원하는 후보만 남기고 같은 확률로 하나를 고를 수 있어요. 후보가 하나면 바로 선택하고, 동작 줄이기 설정을 켜면 회전 없이 결과를 보여드려요." },
    ].map(({ Icon, title, body }) => <section key={title} className="rounded-3xl border border-border bg-white/75 p-6 sm:p-8"><h2 className="flex items-center gap-3 text-xl font-bold"><Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />{title}</h2><p className="mt-4 text-sm leading-8 text-muted-foreground">{body}</p></section>)}</div>
    <section className="mt-8 rounded-3xl border border-border p-6 sm:p-8"><h2 className="text-xl font-bold">게임 정보와 이용 범위</h2><p className="mt-4 text-sm leading-8 text-muted-foreground">게임 상세에서 출처와 확인일을 볼 수 있어요. 소개와 규칙 안내는 직접 작성한 요약이며, 보유한 판본의 공식 규칙서를 우선 확인해 주세요. 이용 권한을 확인하지 않은 외부 이미지나 규칙 원문은 복제하지 않아요.</p><p className="mt-3 text-sm leading-8 text-muted-foreground">현재 개발 미리보기는 소량의 게임으로 제공해요. 운영 서비스에는 공개 검토를 마친 자료만 사용하며, 미리보기 안내가 있으면 검토 중인 정보임을 확인해 주세요. 국내 인기나 모든 모임에서의 적합함을 보장하지 않아요.</p></section>
    <Link href="/#find-game" className={buttonVariants({ className: "mt-8 min-h-12" })}>우리 모임 게임 찾기</Link>
  </main>;
}
