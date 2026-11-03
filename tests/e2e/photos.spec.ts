import { expect, test } from "@playwright/test";

test("허가된 실물 사진 6장이 로컬에서 로드되고 출처·라이선스를 표시한다", async ({ page }, testInfo) => {
  const externalImages: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "image" && new URL(request.url()).hostname !== "127.0.0.1") externalImages.push(request.url());
  });
  for (const slug of ["klask", "rummikub-classic", "carcassonne", "ubongo", "halli-galli", "6-nimmt"]) {
    await page.goto(`/games/${slug}`);
    const figure = page.locator("figure");
    const photo = figure.getByRole("img");
    await expect(photo).toBeVisible();
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate((element) => {
      const image = element as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    })).toBe(true);
    await expect(photo).toHaveAttribute("src", /\/_next\/image\?/);
    await expect(figure.getByRole("link", { name: /^CC BY/ })).toHaveAttribute("href", /^https:\/\/creativecommons.org\/licenses\//);
    await expect(figure).toContainText("내용 편집 없음");
    await expect(figure).toContainText("한국 판매판");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(externalImages).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("licensed-photos.png"), fullPage: true });
});

test("추천 카드에도 사진과 크레딧을 표시하고 미확인 게임에는 대체하지 않는다", async ({ page }) => {
  await page.goto("/recommend?players=4&playTime=BETWEEN_30_60&mood=RELAXED&difficulty=ANY");
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "카르카손", exact: true }) });
  await expect(card.getByRole("img")).toBeVisible();
  await expect(card.getByRole("link", { name: "CC BY 4.0", exact: true })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  await page.goto("/games/dobble");
  await expect(page.locator("figure img")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "도블", exact: true })).toBeVisible();
});
