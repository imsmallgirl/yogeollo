import { z } from "zod";
const siteUrlSchema = z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "HTTP 또는 HTTPS 주소가 필요합니다.");
export function parseSiteUrl(value: string | undefined): string {
  return siteUrlSchema.parse(value ?? "http://localhost:3000");
}
export const siteUrl = parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
