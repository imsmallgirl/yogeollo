import { expect, test } from "@playwright/test";

const results = "/recommend?players=4&playTime=BETWEEN_30_60&mood=RELAXED&difficulty=ANY";

test("결과에서 상세로 이동해 자체 요약·출처·필수 정보를 확인한다", async ({ page }, testInfo) => {
  await page.goto(results);
  await page.locator('a[href="/games/coffee-rush"]').filter({ hasText: "게임 자세히 보기" }).click();
  await expect(page).toHaveURL(/\/games\/coffee-rush$/);
  await expect(page.getByRole("heading", { level: 1, name: "커피 러시" })).toBeVisible();
  await page.goto("/games/splendor");
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
  const candidate = roulette.getByRole("checkbox", { name: "커피 러시", exact: true });
  await expect(candidate).toBeChecked();
  for (const checkbox of await roulette.getByRole("checkbox").all()) await checkbox.uncheck();
  await expect(roulette.getByRole("button", { name: "룰렛 돌리기" })).toBeDisabled();
  await expect(roulette.getByRole("status")).toContainText("후보를 1개 이상");
  await candidate.check();
  await roulette.getByRole("button", { name: "이 게임으로 정하기" }).click();
  await expect(roulette.getByRole("status")).toContainText("오늘은 커피 러시!");
  await expect(roulette.getByRole("link", { name: "선택한 게임 자세히 보기" })).toHaveAttribute("href", "/games/coffee-rush");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("roulette.png"), fullPage: true });
});

test("동작 줄이기 설정에서도 후보 선택과 결과를 읽을 수 있다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(results);
  const roulette = page.getByRole("region", { name: "오늘은 룰렛으로 요걸로!" });
  await expect(roulette.getByRole("checkbox")).toHaveCount(5);
  const candidates = await roulette.getByRole("checkbox").evaluateAll((inputs) => inputs.map((input) => `/games/${(input as HTMLInputElement).value}`));
  await roulette.getByRole("button", { name: "룰렛 돌리기" }).click();
  await expect(roulette.getByRole("status")).toContainText("오늘은 ");
  const winner = await roulette.getByRole("link", { name: "선택한 게임 자세히 보기" }).getAttribute("href");
  expect(candidates).toContain(winner);
  await expect(roulette.getByTestId("roulette-wheel")).toHaveCSS("transition-property", "none");
});


test("실제 여러 후보의 룰렛이 회전하고 선택한 게임 상세로 연결된다", async ({ page }) => {
  await page.goto(results);
  const roulette = page.getByRole("region", { name: "오늘은 룰렛으로 요걸로!" });
  await expect(roulette.getByRole("checkbox")).toHaveCount(5);
  await roulette.getByRole("button", { name: "룰렛 돌리기" }).click();
  await expect(roulette.getByRole("button", { name: "게임 고르는 중…" })).toBeDisabled();
  await expect(roulette.getByTestId("roulette-wheel")).toHaveCSS("transition-property", "transform");
  await expect(roulette.getByRole("status")).toContainText("오늘은 ");
  const link = roulette.getByRole("link", { name: "선택한 게임 자세히 보기" });
  const href = await link.getAttribute("href");
  await link.click();
  await expect(page).toHaveURL((url) => url.pathname === href);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});


test("추가 게임 상세에서 출처·표기 수치와 미확인 설명을 구분한다", async ({ page }) => {
  await page.goto("/games/dobble");
  await expect(page.getByRole("heading", { level: 1, name: "도블", exact: true })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "2~8명" })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "15분" })).toBeVisible();
  await expect(page.getByRole("link", { name: /아콩다콩 도블 상품 안내/ })).toHaveAttribute("href", "https://www.akongdakong.co.kr/goods/goods_view.php?goodsNo=1589");
  await expect(page.getByText("게임 소개를 확인하고 있어요.", { exact: true })).toBeVisible();
  await expect(page.getByText("설명을 확인하고 있어요.", { exact: true })).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
