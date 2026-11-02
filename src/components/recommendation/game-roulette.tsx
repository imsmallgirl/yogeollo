"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chooseRouletteIndex, rouletteCandidatesSchema, rouletteEndRotation, selectedRouletteCandidates, type RouletteCandidate } from "@/domain/roulette/roulette";

const colors = ["#e7a18e", "#9fc5bb", "#ecd18a", "#c2b3d3", "#aac6db"];

export function GameRoulette({ candidates }: { candidates: readonly RouletteCandidate[] }) {
  const validated = rouletteCandidatesSchema.parse(candidates);
  return <RouletteSession key={JSON.stringify(validated)} candidates={validated} />;
}

function RouletteSession({ candidates }: { candidates: RouletteCandidate[] }) {
  const [selected, setSelected] = useState(candidates.map((candidate) => candidate.slug));
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<RouletteCandidate | null>(null);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const pendingWinner = useRef<RouletteCandidate | null>(null);
  const active = selectedRouletteCandidates(candidates, selected);

  const finish = useCallback(() => {
    if (!locked.current || !pendingWinner.current) return;
    setWinner(pendingWinner.current);
    pendingWinner.current = null;
    locked.current = false;
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase !== "spinning") return;
    const timer = window.setTimeout(finish, 2700);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => { if (media.matches) finish(); };
    media.addEventListener("change", changed);
    return () => { window.clearTimeout(timer); media.removeEventListener("change", changed); };
  }, [phase, finish]);

  useEffect(() => () => { locked.current = false; pendingWinner.current = null; }, []);

  function toggle(slug: string) {
    if (locked.current) return;
    setSelected((values) => values.includes(slug) ? values.filter((value) => value !== slug) : [...values, slug]);
    setWinner(null);
    setError("");
    setPhase("idle");
    // A changed sector layout should start from its unrotated position.
    setRotation(0);
  }

  function spin() {
    if (locked.current || active.length === 0) return;
    locked.current = true;
    setWinner(null);
    setError("");
    try {
      const index = chooseRouletteIndex(active.length, () => {
        const value = new Uint32Array(1);
        globalThis.crypto.getRandomValues(value);
        return value[0];
      });
      const choice = active[index];
      if (active.length === 1) {
        locked.current = false;
        setWinner(choice);
        setPhase("done");
        return;
      }
      setRotation(rouletteEndRotation(rotation, index, active.length));
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        locked.current = false;
        setWinner(choice);
        setPhase("done");
      } else {
        pendingWinner.current = choice;
        setPhase("spinning");
      }
    } catch {
      locked.current = false;
      pendingWinner.current = null;
      setPhase("idle");
      setError("게임을 고르지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  const gradient = active.length ? `conic-gradient(${active.map((_, index) => `${colors[index]} ${index * 360 / active.length}deg ${(index + 1) * 360 / active.length}deg`).join(", ")})` : "var(--muted)";
  return <section aria-labelledby="roulette-title" className="mt-12 rounded-3xl border border-border bg-white/75 p-5 sm:p-8">
    <p className="mb-2 text-xs font-semibold text-primary">마지막 선택이 고민된다면</p><h2 id="roulette-title" className="text-2xl font-bold">오늘은 룰렛으로 요걸로!</h2>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">추천받은 게임 중 마음에 드는 후보만 남겨요. 선택한 후보는 같은 확률로 뽑혀요.</p>
    <div className="mt-7 grid items-center gap-8 md:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        <fieldset disabled={phase === "spinning"}><legend className="mb-3 text-sm font-semibold">룰렛에 넣을 후보 <span className="text-primary">{active.length}개</span></legend><div className="space-y-2">{candidates.map((candidate) => <label key={candidate.slug} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"><input type="checkbox" checked={selected.includes(candidate.slug)} onChange={() => toggle(candidate.slug)} value={candidate.slug} className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring" /><span aria-hidden="true" className="text-xs font-semibold text-muted-foreground">{active.findIndex((item) => item.slug === candidate.slug) >= 0 ? active.findIndex((item) => item.slug === candidate.slug) + 1 : "–"}</span><span className="min-w-0 break-words">{candidate.nameKo}</span></label>)}</div></fieldset>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">{active.length === 1 ? "후보가 1개라 회전 없이 바로 선택해요." : "회전하는 동안에는 후보를 바꿀 수 없어요."}</p>
        <Button onClick={spin} disabled={phase === "spinning" || active.length === 0} className="mt-4 min-h-12 w-full sm:w-auto">{phase === "spinning" ? "게임 고르는 중…" : active.length === 1 ? "이 게임으로 정하기" : "룰렛 돌리기"}</Button>
        <div role="status" aria-live="polite" aria-atomic="true" className="mt-5 min-h-14 text-sm leading-7">
          {error ? <p className="text-primary">{error}</p> : phase === "spinning" ? <p>선택한 후보 중에서 한 게임을 고르고 있어요…</p> : winner ? <div><p className="font-semibold">오늘은 {winner.nameKo}!</p><Link href={`/games/${winner.slug}`} className="font-semibold text-primary underline underline-offset-4">선택한 게임 자세히 보기</Link></div> : <p className="text-muted-foreground">{active.length === 0 ? "후보를 1개 이상 선택해 주세요." : "마음에 드는 후보를 확인하고 결정해 보세요."}</p>}
        </div>
      </div>
      <div aria-hidden="true" className="relative mx-auto size-60">
        <svg className="absolute -top-2 left-1/2 z-20 size-7 -translate-x-1/2 text-primary" viewBox="0 0 24 24"><path d="M2 2h20L12 22Z" fill="currentColor" /></svg>
        <div className="relative size-full rounded-full border-[6px] border-white shadow-sm" data-testid="roulette-wheel"
          style={{ background: gradient, transform: `rotate(${rotation}deg)`, transition: phase === "spinning" ? "transform 2400ms cubic-bezier(.12,.75,.13,1)" : "none" }}
          onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === "transform") finish(); }}>
          {active.map((candidate, index) => {
            const angle = (index + 0.5) * 2 * Math.PI / active.length;
            return <span key={candidate.slug} className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-foreground" style={{ left: `${50 + Math.sin(angle) * 34}%`, top: `${50 - Math.cos(angle) * 34}%` }}>{index + 1}</span>;
          })}
        </div><span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-primary"><Dices className="size-6" /></span>
      </div>
    </div>
  </section>;
}
