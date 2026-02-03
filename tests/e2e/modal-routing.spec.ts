import { test, expect } from "@playwright/test";

const closeDialog = async (page: import("@playwright/test").Page) => {
	const dialog = page.locator('[data-slot="dialog-content"]:visible').first();
	await dialog.locator('[data-slot="dialog-close"]').click();
};

test.describe("modal routing", () => {
	test("welcome modal opens and closes", async ({ page }) => {
		await page.goto("/welcome", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/welcome\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/welcome\/?$/);
	});

	test("info modal opens and closes", async ({ page }) => {
		await page.goto("/info", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/info\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/info\/?$/);
	});

	test("about modal opens and closes", async ({ page }) => {
		await page.goto("/about", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/about\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/about\/?$/);
	});

	test("privacy modal opens and closes", async ({ page }) => {
		await page.goto("/privacy", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/privacy\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/privacy\/?$/);
	});

	test("download modal opens and closes", async ({ page }) => {
		await page.goto("/download", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/download\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/download\/?$/);
	});

	test("mobile menu modal opens and closes", async ({ page }) => {
		await page.goto("/mobileMenu", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/mobileMenu\/?$/);
		await page.getByTestId("mobile-menu-close").click();
		await expect(page).not.toHaveURL(/\/mobileMenu\/?$/);
	});
});
