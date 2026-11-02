import { defineConfig, devices } from "@playwright/test";
const previewUrl = "http://127.0.0.1:3173";
const productionUrl = "http://127.0.0.1:3174";
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: true, workers: 2,
  forbidOnly: !!process.env.CI, retries: process.env.CI ? 2 : 0,
  use: { baseURL: previewUrl, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", testIgnore: "production.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testIgnore: "production.spec.ts", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    { name: "compact", testIgnore: "production.spec.ts", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 740 } } },
    { name: "production", testMatch: "production.spec.ts", use: { ...devices["Desktop Chrome"], baseURL: productionUrl } },
  ],
  webServer: [
    { command: "pnpm dev --hostname 127.0.0.1 --port 3173", url: previewUrl, reuseExistingServer: false,
      env: { YOGEOLLO_E2E: "1", GAME_DATA_MODE: "preview" } },
    { command: "pnpm start --hostname 127.0.0.1 --port 3174", url: productionUrl, reuseExistingServer: false,
      env: { GAME_DATA_MODE: "preview", YOGEOLLO_E2E: "0" } },
  ],
});
