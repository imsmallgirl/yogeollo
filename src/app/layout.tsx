import type { Metadata } from "next";
import Link from "next/link";
import { Dices } from "lucide-react";
import { siteUrl } from "@/lib/env";
import "./globals.css";
export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: { default: "요걸로 | 우리 모임에 맞는 보드게임", template: "%s | 요걸로" }, description: "인원, 시간, 분위기에 맞는 보드게임을 고르는 서비스. 현재 준비 중입니다.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="antialiased"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:bg-background focus:p-4">본문으로 건너뛰기</a><header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7"><Link href="/" className="flex items-center gap-2 text-xl font-extrabold"><Dices aria-hidden="true" className="text-primary" />요걸로<span className="ml-1 text-xs font-normal text-muted-foreground">yogeollo</span></Link><span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">서비스 준비 중</span></header>{children}<footer className="mx-auto max-w-6xl border-t border-border px-6 py-7 text-sm text-muted-foreground">요걸로 · 우리 모임의 다음 한 판</footer></body></html>;
}
