import { expect, test } from "@playwright/test";

test("운영 서버는 preview 환경변수로도 미검토 샘플을 노출하지 않는다", async ({ page }) => {
  await page.goto("/recommend?players=4&playTime=BETWEEN_30_60&mood=RELAXED&difficulty=ANY");
  await expect(page.getByRole("heading", { name: "게임 정보를 꼼꼼히 확인하고 있어요" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "스플렌더", exact: true })).toHaveCount(0);
  await expect(page.getByText("미리보기 결과예요", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("definition").filter({ hasText: "4명" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
