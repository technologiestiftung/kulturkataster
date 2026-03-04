import { test, expect } from "@playwright/test";
import { recordNavigationTiming } from "../helpers/navigationTiming";
import { prepareStableUi } from "../helpers/e2eStableUi";
import { safeGoto } from "../helpers/e2eNavigation";

const closeDialog = async (page: import("@playwright/test").Page) => {
	await safeGoto(page, "/de/list", /\/de\/list\/?$/);
};

test.describe("modal routing", () => {
	test.setTimeout(180_000);

	const localized = (path: string) => `/de${path}`;

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("welcome modal opens and closes", async ({ page }, testInfo) => {
		await safeGoto(page, localized("/list"), /\/de\/list\/?$/);
		await safeGoto(page, localized("/welcome"), /\/de\/welcome\/?$/);
		await recordNavigationTiming(page, testInfo, "modal-open-welcome");
		await expect(page).toHaveURL(/\/welcome\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-welcome");
	});

	test("info modal opens and closes", async ({ page }, testInfo) => {
		await safeGoto(page, localized("/list"), /\/de\/list\/?$/);
		await safeGoto(page, localized("/info"), /\/de\/info\/?$/);
		await recordNavigationTiming(page, testInfo, "modal-open-info");
		await expect(page).toHaveURL(/\/info\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-info");
	});

	test("about modal opens and closes", async ({ page }, testInfo) => {
		await safeGoto(page, localized("/list"), /\/de\/list\/?$/);
		await safeGoto(page, localized("/about"), /\/de\/about\/?$/);
		await recordNavigationTiming(page, testInfo, "modal-open-about");
		await expect(page).toHaveURL(/\/about\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-about");
	});

	test("privacy modal opens and closes", async ({ page }, testInfo) => {
		await safeGoto(page, localized("/list"), /\/de\/list\/?$/);
		await safeGoto(page, localized("/privacy"), /\/de\/privacy\/?$/);
		await recordNavigationTiming(page, testInfo, "modal-open-privacy");
		await expect(page).toHaveURL(/\/privacy\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-privacy");
	});

	test("download modal opens and closes", async ({ page }, testInfo) => {
		await safeGoto(page, localized("/list"), /\/de\/list\/?$/);
		await safeGoto(page, localized("/download"), /\/de\/download\/?$/);
		await recordNavigationTiming(page, testInfo, "modal-open-download");
		await expect(page).toHaveURL(/\/download\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-download");
	});

	test("mobile menu modal opens and closes", async ({ page }, testInfo) => {
		await safeGoto(page, localized("/list"), /\/de\/list\/?$/);
		await safeGoto(page, localized("/mobileMenu"), /\/de\/mobileMenu\/?$/);
		await recordNavigationTiming(page, testInfo, "modal-open-mobile-menu");
		await expect(page).toHaveURL(/\/mobileMenu\/?$/);
		await closeDialog(page);
		await expect(page).toHaveURL(/\/list\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "modal-close-mobile-menu");
	});
});
