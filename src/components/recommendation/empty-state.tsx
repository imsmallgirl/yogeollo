import Link from "next/link";
import { Dices } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
export function EmptyState({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return <section className="rounded-3xl border border-dashed border-border bg-white/50 px-6 py-14 text-center"><span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-muted text-primary"><Dices aria-hidden="true" className="size-7" /></span><h2 className="text-xl font-bold">{title}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{description}</p><Link href={href} className={buttonVariants({ className: "mt-7" })}>{action}</Link></section>;
}
