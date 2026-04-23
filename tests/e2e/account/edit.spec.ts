import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { safeGoto } from "../../helpers/e2eNavigation";
import { USER_STORAGE_STATE } from "../../helpers/e2eAuthState";

const email = process.env.E2E_USER_EMAIL;
const hasRealUserCredentials = !!email && !!process.env.E2E_USER_PASSWORD;

test.describe("account edit", () => {
	test.setTimeout(90_000);
	test.use({ storageState: USER_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("direct /de/account/edit shows personal data fields and secure password controls", async ({
		page,
	}) => {
		await safeGoto(page, "/de/account/edit", /\/de\/account\/edit\/?$/);

		await expect(
			page.locator("h1:not(.sr-only)", {
				hasText: "Persönliche Angaben ändern",
			}),
		).toBeVisible();
		await expect(page.getByLabel("Ihr Name")).toBeVisible();
		await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Passwort", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Passwort bestätigen" }),
		).toBeVisible();
		await expect(page.getByLabel("E-Mail-Adresse")).toHaveValue(email ?? "");
	});

	test("account route allows reaching edit workflow", async ({ page }) => {
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
		await expect(page).toHaveURL(/\/de\/account(?:\/activity)?\/?$/, {
			timeout: 5_000,
		});
		await expect(
			page.getByRole("button", { name: "Profileinstellungen" }),
		).toBeVisible();
		await Promise.all([
			page.waitForURL(/\/de\/account\/edit\/?$/, { timeout: 15_000 }),
			page
				.getByRole("button", { name: "Profileinstellungen" })
				.first()
				.click({ delay: 100 }),
		]);
		await expect(
			page.locator("h1:not(.sr-only)", {
				hasText: "Persönliche Angaben ändern",
			}),
		).toBeVisible();
	});

	test("delete account opens confirmation dialog with confirm action", async ({
		page,
	}) => {
		await safeGoto(page, "/de/account/edit", /\/de\/account\/edit\/?$/);

		await expect(
			page.getByRole("button", { name: "Profil löschen" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Profil löschen" }).first().click();
		const deleteDialog = page
			.locator('[data-slot="dialog-content"]')
			.filter({ hasText: /Profil löschen/i })
			.first();
		await expect(deleteDialog).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole("button", { name: "Profil löschen" }).last(),
		).toBeVisible();
	});
});
