import { z } from "zod";
import records from "../../../data/game-photos.json";

const licenses = {
  "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
} as const;
const text = z.string().trim().min(1);
const httpsUrl = z.url({ protocol: /^https$/ });
export const gamePhotoSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  src: z.string().regex(/^\/game-photos\/[a-z0-9-]+\.jpg$/),
  width: z.number().int().positive(), height: z.number().int().positive(),
  altKo: text, title: text, creator: text, creatorUrl: httpsUrl,
  sourceUrl: httpsUrl, sourceRevisionUrl: httpsUrl, downloadUrl: httpsUrl, originalUrl: httpsUrl,
  license: z.enum(["CC BY 2.0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 4.0"]),
  licenseUrl: httpsUrl, modificationsKo: text, editionNoteKo: text,
  verificationStatus: z.literal("OPEN_LICENSE_CONFIRMED"), verifiedBy: text,
  verifiedAt: z.iso.datetime({ offset: true }), sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).refine((photo) => photo.licenseUrl === licenses[photo.license], { path: ["licenseUrl"], message: "확인한 라이선스와 공식 링크가 일치해야 합니다." });
export const gamePhotosSchema = z.array(gamePhotoSchema).refine((photos) =>
  new Set(photos.map((photo) => photo.slug)).size === photos.length && new Set(photos.map((photo) => photo.src)).size === photos.length,
  "게임별 사진과 파일 경로가 중복될 수 없습니다.");
export const gamePhotos = gamePhotosSchema.parse(records);
export function getGamePhoto(slug: string) {
  return gamePhotos.find((photo) => photo.slug === slug) ?? null;
}
