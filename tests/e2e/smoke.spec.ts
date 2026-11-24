import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("redirects to a locale and carries the mood into the questionnaire", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(cn|en)$/);

  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1, name: /Tell us the mood/ })).toBeVisible();
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
  await page.getByRole("link", { name: /Boulevardier/ }).first().click();
  await expect(page).toHaveURL(/\/en\/cocktail\/boulevardier$/);
  await expect(page.getByRole("heading", { level: 1, name: "Boulevardier" })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

test("a private drink without its token explains itself", async ({ page }) => {
  await page.goto("/en/drink/doesnotexist");
  await expect(page.getByRole("heading", { name: "We can't find this drink" })).toBeVisible();
});

test("a refresh part-way through the questionnaire keeps the answers", async ({ page }) => {
  await page.goto("/en/questions?mood=reflect");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await page.getByText("Strong", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your home bar" })).toBeVisible();
  await expect(page.getByText("Pick your skill to continue.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Your home bar" })).toBeVisible();
  await page.getByRole("button", { name: /Back/ }).click();
  await expect(page.getByRole("radio", { name: /Strong/ })).toBeChecked();
});

test("a private drink goes on the menu once photographed, and comes off again", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL to plant a private drink");
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
  const id = `e2e${Date.now().toString(36)}`;
  const editToken = `token-${id}`;
  const hash = createHash("sha256").update(editToken).digest("hex");

  try {
    // A private copy of a seed, without its photograph.
    await sql`
      insert into drinks (id, edit_token_hash, "order", recipe, base_spirit, mood)
      select ${id}, ${hash}, "order", recipe, base_spirit, mood from drinks where id = 'seed-boulevardier'`;
    await sql`delete from rate_limits where key like 'publish:%'`;

    await page.addInitScript(
      (saved) => localStorage.setItem("moodshaker:drinks", JSON.stringify([saved])),
      { id, editToken, name: { cn: "花花公子", en: "Boulevardier" }, createdAt: new Date().toISOString() },
    );
    // The page asks for a photograph by itself; never let that reach the image model.
    await page.route(`**/api/drinks/${id}/image`, (route) =>
      route.fulfill({ status: 502, json: { ok: false, error: { code: "IMAGE_FAILED" } } }),
    );

    await page.goto(`/en/drink/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: "Boulevardier" })).toBeVisible();
    await expect(page.getByText("The photo didn't come out.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to the public menu" })).toBeDisabled();
    await expect(page.getByText("A drink goes on the menu once it has its photograph.")).toBeVisible();

    await sql`
      update drinks set image_url = seed.image_url, thumbnail_url = seed.thumbnail_url
      from drinks seed where seed.id = 'seed-boulevardier' and drinks.id = ${id}`;
    await page.reload();
    await page.getByRole("button", { name: "Add to the public menu" }).click();
    await expect(page.getByText("On the public menu.")).toBeVisible();

    // The seed already owns /cocktail/boulevardier, so this copy gets a suffixed address.
    const publicPath = await page.getByRole("link", { name: "View public page" }).getAttribute("href");
    expect(publicPath).toMatch(/\/en\/cocktail\/boulevardier-.+/);
    expect((await page.request.get(publicPath!)).status()).toBe(200);

    await page.getByRole("button", { name: "Take it off the menu" }).click();
    await expect(page.getByRole("button", { name: "Add to the public menu" })).toBeEnabled();
    expect((await page.request.get(publicPath!)).status()).toBe(404);
  } finally {
    await sql`delete from drinks where id = ${id}`;
    await sql.end();
  }
});
