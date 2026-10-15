import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { ADMIN_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("users management", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("shows users table, supports search, create, edit and review route", async ({
		page,
	}) => {
		await safeGoto(page, "/de/account/users", /\/de\/account\/users\/?$/);
		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });

		const uniqueEmail = `e2e.user.${Date.now()}@example.com`;
		await page
			.getByRole("button", { name: "Nutzer*in hinzufügen" })
			.first()
			.click();
		await expect(page).toHaveURL(/\/de\/account\/users\/new\/?$/, {
			timeout: 15_000,
		});
		await expect(page.getByText("Nutzer*in hinzufügen").first()).toBeVisible();
		await page.getByLabel("E-Mail").fill(uniqueEmail);
		await page.getByLabel("Vorname").fill("E2E");
		await page.getByLabel("Nachname").fill("User");
		await page.getByRole("combobox", { name: /Rolle/ }).click();
		const roleOption = page
			.locator('[data-slot="select-content"]:visible [role="option"]:visible')
			.first();
		const roleOptionVisible = await roleOption.isVisible().catch(() => false);
		if (roleOptionVisible) {
			await roleOption.click({ force: true });
		} else {
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("Enter");
		}
		await Promise.all([
			page.waitForURL(/\/de\/account\/users\/?$/, { timeout: 30_000 }),
			page.getByRole("button", { name: "Nutzer*in anlegen" }).last().click(),
		]);
		await expect(page.getByText(uniqueEmail, { exact: false })).toBeVisible({
			timeout: 15_000,
		});

		const searchLabel = page.getByText("Nutzer*innen suchen").first();
		await expect(searchLabel).toBeVisible();
		await searchLabel.locator("xpath=preceding-sibling::button[1]").click();
		const searchInput = page.getByPlaceholder("Nutzer*innen suchen...");
		await expect(searchInput).toBeVisible();
		await searchInput.fill(uniqueEmail);
		await expect(
			page.getByText(uniqueEmail, { exact: false }).first(),
		).toBeVisible();

		const row = page.locator("tbody tr", { hasText: uniqueEmail }).first();
		await row.getByRole("button", { name: "Bearbeiten", exact: true }).click();
		await expect(page).toHaveURL(/\/de\/account\/users\/[^/]+\/edit\/?$/, {
			timeout: 15_000,
		});
		await expect(page.getByText("Nutzer*in bearbeiten").first()).toBeVisible();
		await expect(page.getByLabel("E-Mail")).toBeVisible();
		await expect(page.getByLabel("Vorname")).toBeVisible();
		await expect(page.getByLabel("Nachname")).toBeVisible();
		await expect(page.getByLabel("Status")).toBeVisible();
		await expect(page.getByLabel("Rolle*")).toBeVisible();
		const institutionsField = page.getByLabel("Kulturorte");
		if ((await institutionsField.count()) > 0) {
			await expect(institutionsField).toBeVisible();
		}
		await expect(
			page.getByRole("strong").filter({ hasText: "Passwort zurücksetzen" }),
		).toBeVisible();
		const dsgvoResend = page.getByText("DSGVO-Compliance erneut senden");
		if ((await dsgvoResend.count()) > 0) {
			await expect(dsgvoResend).toBeVisible();
		}

		await page.getByLabel("Nachname").fill("Updated");
		await Promise.all([
			page.waitForURL(/\/de\/account\/users\/?$/, { timeout: 30_000 }),
			page.getByRole("button", { name: "Änderungen speichern" }).click(),
		]);
		await expect(
			page.getByText(uniqueEmail, { exact: false }).first(),
		).toBeVisible({
			timeout: 15_000,
		});

		const reviewButtons = page.getByRole("button", { name: "Claims prüfen" });
		const reviewCount = await reviewButtons.count();
		if (reviewCount > 0) {
			await reviewButtons.first().click();
			await expect(page).toHaveURL(/\/de\/account\/users\/[^/]+\/review\/?$/, {
				timeout: 15_000,
			});
		}
	});
});
