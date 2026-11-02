import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Notice({ title, children, className, role }: {
  title: string; children: ReactNode; className?: string; role?: "alert" | "status";
}) {
  return (
    <aside role={role} className={cn("flex gap-3 rounded-2xl border border-border bg-white/70 p-5 text-sm leading-7", className)}>
      <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
      <div className="min-w-0"><p className="font-semibold">{title}</p><div className="text-muted-foreground">{children}</div></div>
    </aside>
  );
}
