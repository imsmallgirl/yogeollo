import { expect, test, type Page } from "@playwright/test";

const basicQuery = "players=4&playTime=BETWEEN_30_60&mood=RELAXED&difficulty=ANY";

async function checkWidth(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("홈에서 조건을 고르고 결과·확인 정보·조건 복원까지 이동한다", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("무슨 게임 할까?");
  await expect(page.getByRole("radio", { name: "4명", exact: true })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await checkWidth(page);
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
  await page.getByRole("button", { name: "우리 모임 게임 찾기" }).click();
  await expect(page).toHaveURL(new RegExp(`/recommend\\?${basicQuery}$`));
  await expect(page.getByRole("heading", { name: "스플렌더", exact: true })).toBeVisible();
  await expect(page.getByText("미리보기 결과예요", { exact: true })).toBeVisible();
  await expect(page.getByText("표기 시간", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "게임 자세히 보기", exact: true })).toHaveAttribute("href", "/games/splendor");
  await checkWidth(page);
  await page.screenshot({ path: testInfo.outputPath("results.png"), fullPage: true });
  await page.getByText(/함께 확인할 정보/).click();
  await expect(page.getByText(/실제 재고는 미확인/)).toBeVisible();
  await page.getByRole("link", { name: "모임 조건 다시 고르기" }).click();
  await expect(page.getByRole("radio", { name: "4명", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "편안하고 가벼운 게임", exact: true })).toBeChecked();
  expect(errors).toEqual([]);
});

test("7명 이상은 정확한 인원을 검증하고 빈 결과에서도 보존한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "7명 이상", exact: true }).check();
  await page.getByRole("button", { name: "우리 모임 게임 찾기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("조건을 확인");
  await expect(page.getByRole("main").getByRole("alert")).toBeFocused();
  await page.getByLabel("정확한 인원수").fill("6");
  await page.getByRole("button", { name: "우리 모임 게임 찾기" }).click();
  await expect(page.getByText("7명 이상의 정확한 인원수를 정수로 입력해 주세요.", { exact: true })).toBeVisible();
  await page.getByLabel("정확한 인원수").fill("8");
  await page.getByRole("button", { name: "우리 모임 게임 찾기" }).click();
  await expect(page).toHaveURL(/players=7-plus&exactPlayers=8/);
  await expect(page.getByRole("heading", { name: "지금 조건에 맞는 게임을 찾지 못했어요" })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "8명" })).toBeVisible();
  await checkWidth(page);
  await page.getByRole("link", { name: "조건 바꿔서 다시 찾기" }).click();
  await expect(page.getByLabel("정확한 인원수")).toHaveValue("8");
});

test("시간을 완화하면 결과와 카드 양쪽에서 명확히 표시한다", async ({ page }) => {
  await page.goto("/recommend?players=2&playTime=UP_TO_15&mood=STRATEGY&difficulty=BEGINNER");
  await expect(page.getByText("시간 조건을 일부 완화했어요", { exact: true })).toBeVisible();
  await expect(page.getByText("시간 조건을 완화한 게임이에요", { exact: true })).toBeVisible();
  await expect(page.getByText(/게임 표기 시간은 30분/)).toBeVisible();
  await expect(page.getByText(/선택보다 오래 걸릴 수 있어요/)).toBeVisible();
  await checkWidth(page);
});

test("새로고침과 직접 URL에서도 같은 조건과 결과를 보여준다", async ({ page }) => {
  await page.goto(`/recommend?${basicQuery}`);
  await expect(page.getByRole("heading", { name: "스플렌더", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "스플렌더", exact: true })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "4명" }).first()).toBeVisible();
});

test("누락·중복·알 수 없는 URL 입력은 추천하지 않는다", async ({ page }) => {
  for (const query of ["", `${basicQuery}&players=2`, basicQuery.replace("RELAXED", "unknown")]) {
    await page.goto(`/recommend?${query}`);
    await expect(page.getByRole("heading", { name: "추천 조건을 확인해 주세요" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(page.getByRole("heading", { name: "스플렌더", exact: true })).toHaveCount(0);
    await checkWidth(page);
  }
});

test("키보드로 인원 선택을 바꾸고 본문으로 이동할 수 있다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "본문으로 건너뛰기" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  const radio = page.getByRole("radio", { name: "4명", exact: true });
  await radio.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "5명", exact: true })).toBeChecked();
});
