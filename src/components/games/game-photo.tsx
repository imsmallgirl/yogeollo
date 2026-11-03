import Image from "next/image";
import { getGamePhoto } from "@/domain/games/photos";

/** Attribution travels with every displayed copy, including recommendation cards. */
export function GamePhoto({ slug, detail = false }: { slug: string; detail?: boolean }) {
  const photo = getGamePhoto(slug);
  if (!photo) return null;
  return <figure className={`overflow-hidden rounded-2xl border border-border bg-white/75 ${detail ? "mt-7" : "mt-5"}`}>
    <Image src={photo.src} alt={photo.altKo} width={photo.width} height={photo.height}
      loading={detail ? "eager" : "lazy"} sizes="(max-width: 768px) 100vw, 960px" className={`w-full object-contain ${detail ? "h-72 sm:h-96" : "h-52 sm:h-64"}`} />
    <figcaption className="space-y-1 border-t border-border px-4 py-3 text-xs leading-6 text-muted-foreground">
      <p className="break-words">사진: <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">{photo.title}</a> · <a href={photo.creatorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{photo.creator}</a> · <a href={photo.licenseUrl} target="_blank" rel="license noopener noreferrer" className="text-primary underline underline-offset-4">{photo.license}</a></p>
      <p>{photo.modificationsKo}</p><p>{photo.editionNoteKo}</p>
    </figcaption>
  </figure>;
}
