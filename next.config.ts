import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.YOGEOLLO_E2E === "1" ? ".next-e2e" : ".next",
};
export default nextConfig;
