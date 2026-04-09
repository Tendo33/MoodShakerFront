import { test, expect } from "@playwright/test";

test("localized shell and questionnaire flow render", async ({ page }) => {
  await page.goto("/cn");

  await expect(page).toHaveURL(/\/cn$/);
  const startLink = page
    .getByRole("main")
    .getByRole("link", { name: /帮我选一杯酒/i })
    .first();
  await expect(startLink).toBeVisible();

  await startLink.click();
  await expect(page).toHaveURL(/\/cn\/questions/);

  await expect(
    page.getByRole("heading", { name: /您想要什么类型的鸡尾酒/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /经典鸡尾酒/i }).click();
  await expect(
    page.getByRole("heading", { name: /您希望酒精浓度如何/i }),
  ).toBeVisible();
});
