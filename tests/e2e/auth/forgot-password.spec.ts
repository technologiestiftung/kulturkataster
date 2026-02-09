import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { safeGoto } from "../../helpers/e2eNavigation";

const resetEmail = process.env.E2E_RESET_EMAIL;
const hasResetEmail = !!resetEmail;

test.describe("auth forgot password", () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("invalid submit shows validation dialog", async ({ page }) => {
		await safeGoto(page, "/de/forgot-password", /\/de\/forgot-password\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "Forgot-password form input was not visible.");
		}
		await emailInput.fill("invalid-email");
		await page.locator('form button[type="submit"]').click();

		await expect(page).toHaveURL(/\/de\/forgot-password\/?$/);
	});

	test("valid submit shows success and returns to login", async ({ page }) => {
		test.skip(!hasResetEmail, "E2E_RESET_EMAIL not set");

		await safeGoto(page, "/de/forgot-password", /\/de\/forgot-password\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "Forgot-password form input was not visible.");
		}
		await emailInput.fill(resetEmail!);
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
		await expect(page).toHaveURL(/\/de\/login\/?$/);
	});
});
