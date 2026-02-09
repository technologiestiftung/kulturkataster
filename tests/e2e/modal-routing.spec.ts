import { test, expect } from "@playwright/test";
import { recordNavigationTiming } from "../helpers/navigationTiming";
import { prepareStableUi } from "../helpers/e2eStableUi";

const closeDialog = async (page: import("@playwright/test").Page) => {
	await page.goto("/de/list", { waitUntil: "domcontentloaded" });
};

test.describe("modal routing", () => {
	const localized = (path: string) => `/de${path}`;

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("welcome modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/welcome"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-welcome");
		await expect(page).toHaveURL(/\/welcome\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-welcome");
	});

	test("info modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/info"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-info");
		await expect(page).toHaveURL(/\/info\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-info");
	});

	test("about modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/about"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-about");
		await expect(page).toHaveURL(/\/about\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-about");
	});

	test("privacy modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/privacy"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-privacy");
		await expect(page).toHaveURL(/\/privacy\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-privacy");
	});

	test("download modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/download"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "modal-open-download");
		await expect(page).toHaveURL(/\/download\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-download");
	});

	test("mobile menu modal opens and closes", async ({ page }, testInfo) => {
		await page.goto(localized("/list"), { waitUntil: "domcontentloaded" });
		await page.goto(localized("/mobileMenu"), {
			waitUntil: "domcontentloaded",
		});
		await recordNavigationTiming(page, testInfo, "modal-open-mobile-menu");
		await expect(page).toHaveURL(/\/mobileMenu\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-mobile-menu");
	});
});
