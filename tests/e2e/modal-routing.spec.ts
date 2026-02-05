import { test, expect } from "@playwright/test";
import { recordNavigationTiming } from "../helpers/navigationTiming";

const closeDialog = async (page: import("@playwright/test").Page) => {
	// Ensure app close handlers that rely on Next history idx choose router.back().
	await page.evaluate(() => {
		const current = (window.history.state ?? {}) as Record<string, unknown>;
		window.history.replaceState({ ...current, idx: 1 }, "", window.location.href);
	});
	const dialog = page.locator('[data-slot="dialog-content"]:visible').first();
	await dialog.locator('[data-slot="dialog-close"]').click({ force: true });
	await expect(dialog).toBeHidden({ timeout: 15_000 });
};

test.describe("modal routing", () => {
	const localized = (path: string) => `/de${path}`;

	test("welcome modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/welcome"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-welcome");
		await expect(page).toHaveURL(/\/welcome\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/welcome\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-welcome");
	});

	test("info modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/info"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-info");
		await expect(page).toHaveURL(/\/info\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/info\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-info");
	});

	test("about modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/about"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-about");
		await expect(page).toHaveURL(/\/about\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/about\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-about");
	});

	test("privacy modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/privacy"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-privacy");
		await expect(page).toHaveURL(/\/privacy\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/privacy\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-privacy");
	});

	test("download modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/download"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-download");
		await expect(page).toHaveURL(/\/download\/?$/);
		await closeDialog(page);
		await expect(page).not.toHaveURL(/\/download\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-download");
	});

	test("mobile menu modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/mobileMenu"), {
			waitUntil: "domcontentloaded",
		});
		await recordNavigationTiming(page, testInfo, "modal-open-mobile-menu");
		await expect(page).toHaveURL(/\/mobileMenu\/?$/);
		await page.getByTestId("mobile-menu-close").click();
		await expect(page).not.toHaveURL(/\/mobileMenu\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-mobile-menu");
	});
});
