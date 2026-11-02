import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: new URL("/", siteUrl).toString() }]; }
