import { expect, test } from "@playwright/test";

test("redirects to a locale and carries the mood into the questionnaire", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(cn|en)$/);

  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1, name: "MoodShaker" })).toBeVisible();
  await page.getByRole("button", { name: "Quiet night" }).click();
  await page.getByRole("link", { name: /Shake one for Quiet night/ }).click();

  await expect(page).toHaveURL(/\/en\/questions\?mood=reflect/);
  await expect(page.getByRole("heading", { name: "How strong?" })).toBeVisible();
  await page.getByRole("button", { name: /Back/ }).click();
  await expect(page.getByRole("radio", { name: /Quiet night/ })).toBeChecked();
});

test("menu lists the seeded drinks and opens a detail page", async ({ page }) => {
  await page.goto("/en/gallery");
  await expect(page.getByRole("heading", { level: 1, name: "The Menu" })).toBeVisible();
  await page.getByRole("link", { name: /Sazerac/ }).first().click();
  await expect(page).toHaveURL(/\/en\/cocktail\/sazerac$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sazerac" })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("a private drink without its token explains itself", async ({ page }) => {
  await page.goto("/en/drink/doesnotexist");
  await expect(page.getByRole("heading", { name: "We can't find this drink" })).toBeVisible();
});
