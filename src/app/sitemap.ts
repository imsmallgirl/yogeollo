import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
export default function sitemap(): MetadataRoute.Sitemap { return ["/", "/about"].map((path) => ({ url: new URL(path, siteUrl).toString() })); }
