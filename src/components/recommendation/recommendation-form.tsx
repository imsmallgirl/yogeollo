"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { difficultyLabels, moodLabels, playTimeOptions, type RecommendationPreferences } from "@/domain/recommendation/preferences";
import { parseRecommendationQuery, recommendationHref, type RecommendationErrors } from "@/domain/recommendation/query";
import { ChoiceGroup } from "./choice-group";

const playerOptions = [
  { value: "2", label: "2명" }, { value: "3", label: "3명" }, { value: "4", label: "4명" },
  { value: "5", label: "5명" }, { value: "6", label: "6명" }, { value: "7-plus", label: "7명 이상" },
] as const;

export function RecommendationForm({ initialPreferences, initialError }: {
  initialPreferences: RecommendationPreferences; initialError?: string;
}) {
  const router = useRouter();
  const [players, setPlayers] = useState(initialPreferences.playerCount >= 7 ? "7-plus" : String(initialPreferences.playerCount));
  const [exactPlayers, setExactPlayers] = useState(initialPreferences.playerCount >= 7 ? String(initialPreferences.playerCount) : "");
  const [playTime, setPlayTime] = useState(initialPreferences.playTime);
  const [mood, setMood] = useState(initialPreferences.mood);
  const [difficulty, setDifficulty] = useState(initialPreferences.difficulty);
  const [errors, setErrors] = useState<RecommendationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [pending, startTransition] = useTransition();
  const errorSummary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitError) errorSummary.current?.focus();
  }, [submitError, errors]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRecommendationQuery(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setErrors(parsed.errors);
      setSubmitError("선택한 조건을 확인해 주세요.");
      return;
    }
    setErrors({});
    setSubmitError("");
    startTransition(() => router.push(recommendationHref(parsed.preferences)));
  }

  return (
    <form action="/recommend" method="get" onSubmit={submit} noValidate aria-busy={pending} className="space-y-8">
      {initialError && <p role="alert" className="rounded-xl bg-muted p-4 text-sm leading-7">{initialError}</p>}
      {submitError && <div ref={errorSummary} tabIndex={-1} role="alert" className="rounded-xl border border-primary bg-primary/5 p-4 text-sm text-primary outline-offset-4">{submitError}</div>}
      <fieldset disabled={pending} className="min-w-0 space-y-8 disabled:opacity-70">
        <legend className="sr-only">모임 조건</legend>
        <div>
          <ChoiceGroup name="players" step="01" legend="몇 명이 함께하나요?" options={playerOptions} value={players} onChange={setPlayers} error={errors.players} />
          {players === "7-plus" && <div className="mt-4 max-w-xs">
            <label htmlFor="exactPlayers" className="mb-2 block text-sm font-semibold">정확한 인원수</label>
            <div className="flex items-center gap-3"><input id="exactPlayers" name="exactPlayers" type="number" inputMode="numeric" min={7} step={1} required value={exactPlayers}
              onChange={(event) => setExactPlayers(event.target.value)} aria-invalid={Boolean(errors.exactPlayers)} aria-describedby={`exactPlayers-help${errors.exactPlayers ? " exactPlayers-error" : ""}`}
              className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" /><span className="text-sm">명</span></div>
            <p id="exactPlayers-help" className="mt-2 text-xs leading-6 text-muted-foreground">7명 이상은 실제 인원수로 찾아드려요.</p>
            {errors.exactPlayers && <p id="exactPlayers-error" className="mt-1 text-sm text-primary">{errors.exactPlayers}</p>}
          </div>}
        </div>
        <ChoiceGroup name="playTime" step="02" legend="얼마나 즐길까요?" options={playTimeOptions} value={playTime} onChange={setPlayTime} error={errors.playTime} />
        <ChoiceGroup name="mood" step="03" legend="어떤 분위기를 원하나요?" options={Object.entries(moodLabels).map(([value, label]) => ({ value: value as keyof typeof moodLabels, label }))} value={mood} onChange={setMood} error={errors.mood} />
        <ChoiceGroup name="difficulty" step="04" legend="난이도는 어느 정도가 좋을까요?" options={Object.entries(difficultyLabels).map(([value, label]) => ({ value: value as keyof typeof difficultyLabels, label }))} value={difficulty} onChange={setDifficulty} error={errors.difficulty} />
      </fieldset>
      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">맞는 게임을 최대 5개 골라드려요.<br />결과가 적으면 그 이유도 함께 알려드릴게요.</p>
        <Button type="submit" disabled={pending} className="min-h-14 w-full text-base sm:w-auto sm:px-8">{pending ? "게임 고르는 중…" : "우리 모임 게임 찾기"}<ArrowRight aria-hidden="true" className="size-4" /></Button>
      </div>
    </form>
  );
}
