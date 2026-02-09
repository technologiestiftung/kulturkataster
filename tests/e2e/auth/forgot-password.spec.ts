import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";

const resetEmail = process.env.E2E_RESET_EMAIL;
const hasResetEmail =
	!!resetEmail &&
	!resetEmail.includes("example@") &&
	!resetEmail.includes("example.");

test.describe("auth forgot password", () => {
	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("invalid submit shows validation dialog", async ({ page }) => {
		await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
		await page
			.getByLabel(/E-Mail-Adresse|Email address/i)
			.fill("invalid-email");
		await page.locator('form button[type="submit"]').click();

		const alertDialog = page
			.locator('[data-slot="dialog-content"]')
			.filter({ hasText: /Eingabefehler|Fehler|Error/i })
			.first();
		await expect(alertDialog).toBeVisible();
		await alertDialog.locator('[data-slot="dialog-close"]').click();
		await expect(alertDialog).toBeHidden();
	});

	test("valid submit shows success and returns to login", async ({ page }) => {
		test.skip(!hasResetEmail, "E2E_RESET_EMAIL not set");

		await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
		await page.getByLabel(/E-Mail-Adresse|Email address/i).fill(resetEmail!);
		await page
			.getByRole("button", { name: /Link senden|Send reset link/i })
			.click();

		const successDialog = page.getByRole("dialog", {
			name: /E-Mail gesendet|Email sent/i,
		});
		await expect(successDialog).toBeVisible();
		await successDialog
			.getByRole("button", { name: /Zur Anmeldung|Back to login/i })
			.click();
		await expect(page).toHaveURL(/\/login\/?$/);
	});
});
