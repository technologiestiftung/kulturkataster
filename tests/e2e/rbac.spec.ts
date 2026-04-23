import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../helpers/e2eStableUi";
import { safeGoto } from "../helpers/e2eNavigation";
import {
	ADMIN_STORAGE_STATE,
	USER_STORAGE_STATE,
} from "../helpers/e2eAuthState";

const hasRealUserCredentials =
	!!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD;
const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("rbac regular user", () => {
	test.setTimeout(90_000);
	test.use({ storageState: USER_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("regular user can access institutions", async ({ page }) => {
		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/account\/institutions\/?$/,
		);
		const table = page.getByRole("table");
		const emptyState = page.getByText(
			/Keine Kulturorte vorhanden\.?|No institutions found\.?/i,
		);
		await expect(table.or(emptyState)).toBeVisible({ timeout: 15_000 });
	});
});

test.describe("rbac admin", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("admin sees users tab", async ({ page }) => {
		await expect(
			page.getByRole("tab", { name: /Nutzer\*innen|Users/i }),
		).toBeVisible();
	});
});
