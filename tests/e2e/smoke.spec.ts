import { test, expect } from "@playwright/test";

test.skip("smoke: home loads", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/Kulturkataster/i);
});
