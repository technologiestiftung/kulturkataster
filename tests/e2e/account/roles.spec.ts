import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { ADMIN_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("roles management", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("shows roles table, supports search, create, and edit", async ({
		page,
	}) => {
		await safeGoto(page, "/de/account/roles", /\/de\/account\/roles\/?$/);
		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

		const firstRoleName = (
			await page.locator("tbody tr td").first().innerText()
		).trim();

		const searchLabel = page.getByText("Rollen durchsuchen").first();
		await expect(searchLabel).toBeVisible();
		await searchLabel.locator("xpath=preceding-sibling::button[1]").click();
		const searchInput = page.getByPlaceholder("Rollen durchsuchen...");
		await expect(searchInput).toBeVisible();
		await searchInput.fill(
			firstRoleName.slice(0, Math.min(4, firstRoleName.length)),
		);
		await expect(page.locator("tbody tr").first()).toBeVisible();
		// The toolbar hides the create button while search is open
		await page.getByRole("button", { name: "Suche schließen" }).click();

		const uniqueName = `E2E Rolle ${Date.now()}`;
		// Icon-only toolbar button: the label lives in aria-label
		const createRoleButton = page
			.getByRole("button", { name: /Rolle.*(?:erstellen|hinzuf|add)/i })
			.first();
		test.skip(
			(await createRoleButton.count()) === 0,
			"No create-role action visible for this account.",
		);
		await expect(createRoleButton).toBeVisible({ timeout: 15_000 });
		await createRoleButton.click();
		await expect(page).toHaveURL(/\/de\/account\/roles\/new\/?$/, {
			timeout: 15_000,
		});
		// The dialog renders an sr-only title plus the visible one
		await expect(
			page
				.getByRole("heading", { name: /Rolle.*(?:erstellen|hinzuf)/i })
				.last(),
		).toBeVisible();
		await page.getByLabel("Name").fill(uniqueName);
		await page.getByLabel("Beschreibung").fill("Rolle fuer E2E Test");
		await Promise.all([
			page.waitForURL(/\/de\/account\/roles\/?$/, { timeout: 30_000 }),
			page
				.getByRole("button")
				.filter({ hasText: /Rolle.*(?:erstellen|hinzuf|add)/i })
				.last()
				.click(),
		]);
		await expect(page.getByText(uniqueName, { exact: false })).toBeVisible({
			timeout: 15_000,
		});

		const row = page.locator("tbody tr", { hasText: uniqueName }).first();
		await row.getByRole("button", { name: "Bearbeiten", exact: true }).click();
		await expect(page).toHaveURL(/\/de\/account\/roles\/\d+\/edit\/?$/, {
			timeout: 15_000,
		});
		await expect(
			page.getByRole("heading", { name: "Rolle bearbeiten" }).last(),
		).toBeVisible();

		const updatedDescription = `Updated ${Date.now()}`;
		await page.getByLabel("Beschreibung").fill(updatedDescription);
		await Promise.all([
			page.waitForURL(/\/de\/account\/roles\/?$/, { timeout: 30_000 }),
			page.getByRole("button", { name: "Änderungen speichern" }).click(),
		]);
		await expect(
			page.getByText(uniqueName, { exact: false }).first(),
		).toBeVisible({
			timeout: 15_000,
		});
	});
});
