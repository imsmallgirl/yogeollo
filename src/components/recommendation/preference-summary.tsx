import { Clock3, Gauge, Smile, Users } from "lucide-react";
import { difficultyLabels, moodLabels, playTimeOptions, type RecommendationPreferences } from "@/domain/recommendation/preferences";
export function PreferenceSummary({ preferences }: { preferences: RecommendationPreferences }) {
  const items = [
    { Icon: Users, label: "인원", value: `${preferences.playerCount}명` },
    { Icon: Clock3, label: "시간", value: playTimeOptions.find((option) => option.value === preferences.playTime)?.label },
    { Icon: Smile, label: "분위기", value: moodLabels[preferences.mood] },
    { Icon: Gauge, label: "난이도", value: difficultyLabels[preferences.difficulty] },
  ];
  return <dl aria-label="선택한 추천 조건" className="flex flex-wrap gap-2">{items.map(({ Icon, label, value }) => <div key={label} className="flex min-h-10 max-w-full items-center gap-2 rounded-full border border-border bg-white/70 px-3.5 py-2 text-sm"><Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /><dt className="sr-only">{label}</dt><dd className="min-w-0">{value}</dd></div>)}</dl>;
}
