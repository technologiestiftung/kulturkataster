import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { ADMIN_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("groups management", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("shows groups table, supports search, create, and edit", async ({
		page,
	}) => {
		await safeGoto(page, "/de/account/groups", /\/de\/account\/groups\/?$/);

		const uniqueName = `E2E Gruppe ${Date.now()}`;
		await page
			.getByRole("button", { name: "Gruppe erstellen" })
			.first()
			.click();
		await expect(page).toHaveURL(/\/de\/account\/groups\/new\/?$/, {
			timeout: 15_000,
		});
		await expect(page.getByText("Gruppe erstellen").first()).toBeVisible();
		await page.getByLabel("Name").fill(uniqueName);
		await page.getByLabel("Beschreibung").fill("Gruppe fuer E2E Test");
		await Promise.all([
			page.waitForURL(/\/de\/account\/groups\/?$/, { timeout: 30_000 }),
			page.getByRole("button", { name: "Gruppe erstellen" }).last().click(),
		]);

		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByText(uniqueName, { exact: false }).first(),
		).toBeVisible({
			timeout: 15_000,
		});

		const searchLabel = page.getByText("Gruppen durchsuchen").first();
		await expect(searchLabel).toBeVisible();
		await searchLabel.locator("xpath=preceding-sibling::button[1]").click();
		const searchInput = page.getByPlaceholder("Gruppen durchsuchen...");
		await expect(searchInput).toBeVisible();
		await searchInput.fill(uniqueName.slice(0, 6));
		await expect(
			page.getByText(uniqueName, { exact: false }).first(),
		).toBeVisible();

		const row = page.locator("tbody tr", { hasText: uniqueName }).first();
		await row.getByRole("button", { name: "Edit" }).click();
		await expect(page).toHaveURL(/\/de\/account\/groups\/\d+\/edit\/?$/, {
			timeout: 15_000,
		});
		await expect(page.getByText("Gruppe bearbeiten").first()).toBeVisible();

		const updatedDescription = `Updated ${Date.now()}`;
		await page.getByLabel("Beschreibung").fill(updatedDescription);
		await Promise.all([
			page.waitForURL(/\/de\/account\/groups\/?$/, { timeout: 30_000 }),
			page.getByRole("button", { name: "Änderungen speichern" }).click(),
		]);
		await expect(
			page.getByText(uniqueName, { exact: false }).first(),
		).toBeVisible({
			timeout: 15_000,
		});
	});
});
