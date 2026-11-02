import type { Metadata } from "next";
import Link from "next/link";
import { Dices } from "lucide-react";
import { siteUrl } from "@/lib/env";
import { catalogMode } from "@/server/catalog";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), title: { default: "요걸로 | 우리 모임에 맞는 보드게임", template: "%s | 요걸로" },
  description: "인원, 시간, 분위기와 난이도를 선택하고 우리 모임에 어울리는 보드게임과 추천 이유를 찾아보세요.", robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="antialiased">
    <a href="#main" className="sr-only z-50 focus:not-sr-only focus:absolute focus:rounded-lg focus:bg-background focus:p-4 focus:outline-ring">본문으로 건너뛰기</a>
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8 sm:py-7"><Link href="/" aria-label="요걸로 홈" className="flex min-h-11 items-center gap-2 text-2xl font-extrabold tracking-tight"><Dices aria-hidden="true" className="size-7 text-primary" />요걸로<span className="ml-1 text-xs font-normal tracking-normal text-muted-foreground">yogeollo</span></Link><span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{catalogMode() === "preview" ? "개발 미리보기" : "서비스 준비 중"}</span></header>
    {children}
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-8 text-xs text-muted-foreground sm:px-8"><span className="font-semibold">요걸로 · 우리 모임의 다음 한 판</span><Link href="/about" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">요걸로 소개</Link></footer>
  </body></html>;
}
