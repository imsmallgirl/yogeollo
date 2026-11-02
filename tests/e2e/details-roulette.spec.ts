import { expect, test } from "@playwright/test";

const results = "/recommend?players=4&playTime=BETWEEN_30_60&mood=RELAXED&difficulty=ANY";

test("결과에서 상세로 이동해 자체 요약·출처·필수 정보를 확인한다", async ({ page }, testInfo) => {
  await page.goto(results);
  await page.getByRole("link", { name: "게임 자세히 보기", exact: true }).click();
  await expect(page).toHaveURL(/\/games\/splendor$/);
  await expect(page.getByRole("heading", { level: 1, name: "스플렌더" })).toBeVisible();
  await expect(page).toHaveTitle("스플렌더 | 요걸로");
  for (const title of ["준비 방법", "기본 진행 방법", "승리 조건", "추천 대상", "주의할 점", "출처와 작성 정보"]) {
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/자체 작성 요약 초안/)).toBeVisible();
  await expect(page.getByRole("link", { name: /공식 기본판 규칙서/ })).toHaveAttribute("href", /Splendor_IT\.pdf$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("detail.png"), fullPage: true });
});

test("존재하지 않는 게임은 404이고 소개 페이지에서 기준을 읽을 수 있다", async ({ page }, testInfo) => {
  const response = await page.goto("/games/no-such-game");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible();
  await page.getByRole("link", { name: "요걸로 소개", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: "왜 추천했는지 설명해요" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "게임 정보와 이용 범위" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("about.png"), fullPage: true });
});

test("추천 후보로 룰렛을 선택하고 빈 선택·단일 후보 결과를 안내한다", async ({ page }, testInfo) => {
  await page.goto(results);
  const roulette = page.getByRole("region", { name: "오늘은 룰렛으로 요걸로!" });
  await expect(roulette).toBeVisible();
  const candidate = roulette.getByRole("checkbox", { name: "스플렌더", exact: true });
  await expect(candidate).toBeChecked();
  await candidate.uncheck();
  await expect(roulette.getByRole("button", { name: "룰렛 돌리기" })).toBeDisabled();
  await expect(roulette.getByRole("status")).toContainText("후보를 1개 이상");
  await candidate.check();
  await roulette.getByRole("button", { name: "이 게임으로 정하기" }).click();
  await expect(roulette.getByRole("status")).toContainText("오늘은 스플렌더!");
  await expect(roulette.getByRole("link", { name: "선택한 게임 자세히 보기" })).toHaveAttribute("href", "/games/splendor");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("roulette.png"), fullPage: true });
});

test("동작 줄이기 설정에서도 후보 선택과 결과를 읽을 수 있다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(results);
  const roulette = page.getByRole("region", { name: "오늘은 룰렛으로 요걸로!" });
  await roulette.getByRole("button", { name: "이 게임으로 정하기" }).click();
  await expect(roulette.getByRole("status")).toContainText("오늘은 스플렌더!");
  await expect(roulette.getByTestId("roulette-wheel")).toHaveCSS("transition-property", "none");
});
