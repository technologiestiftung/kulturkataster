import { test, expect } from "@playwright/test";

const closeDialog = async (page: import("@playwright/test").Page) => {
	await page.locator('[data-slot="dialog-close"]').first().click();
};

test.describe("modal routing", () => {
	test("welcome modal opens and closes", async ({ page }) => {
		await page.goto("/welcome");
		await expect(page).toHaveURL(/\/welcome\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/welcome\/?$/);
	});

	test("info modal opens and closes", async ({ page }) => {
		await page.goto("/info");
		await expect(page).toHaveURL(/\/info\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/info\/?$/);
	});

	test("about modal opens and closes", async ({ page }) => {
		await page.goto("/about");
		await expect(page).toHaveURL(/\/about\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/about\/?$/);
	});

	test("privacy modal opens and closes", async ({ page }) => {
		await page.goto("/privacy");
		await expect(page).toHaveURL(/\/privacy\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/privacy\/?$/);
	});

	test("download modal opens and closes", async ({ page }) => {
		await page.goto("/download");
		await expect(page).toHaveURL(/\/download\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/download\/?$/);
	});

	test("mobile menu modal opens and closes", async ({ page }) => {
		await page.goto("/mobileMenu");
		await expect(page).toHaveURL(/\/mobileMenu\/?$/);
		await page.getByTestId("mobile-menu-close").click();
		await expect(page).not.toHaveURL(/\/mobileMenu\/?$/);
	});
});
