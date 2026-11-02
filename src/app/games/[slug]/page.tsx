import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GameDetailContent } from "@/components/games/game-detail-content";
import { EmptyState } from "@/components/recommendation/empty-state";
import { loadGameDetail } from "@/server/game-detail";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  await connection();
  const detail = await loadGameDetail((await params).slug);
  return { title: detail.status === "found" ? detail.game.facts.nameKo : "게임 정보 확인", description: detail.status === "found" ? `${detail.game.facts.nameKo}의 인원·시간과 확인된 게임 정보를 살펴보세요.` : "게임 정보를 확인하고 있어요.", robots: { index: false, follow: false } };
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  await connection();
  const detail = await loadGameDetail((await params).slug);
  if (detail.status === "not-found") notFound();
  return <main id="main" className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8"><Link href="/#find-game" className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"><ArrowLeft aria-hidden="true" className="size-4" />모임에 맞는 게임 찾기</Link>{detail.status === "unavailable" ? <EmptyState title="지금은 게임 정보를 불러올 수 없어요" description="잠시 후 같은 주소에서 다시 시도해 주세요." href="/#find-game" action="게임 찾기로 돌아가기" /> : <GameDetailContent game={detail.game} editorial={detail.editorial} guide={detail.guide} preview={detail.preview} />}</main>;
}
