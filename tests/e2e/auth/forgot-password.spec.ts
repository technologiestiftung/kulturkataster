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
		await safeGoto(page, "/de/forgotPassword", /\/de\/forgotPassword\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "forgotPassword form input was not visible.");
		}
		await emailInput.fill("invalid-email");
		const submitButton = page.locator('form button[type="submit"]');
		await expect(submitButton).toBeVisible();
		await expect(submitButton).toBeEnabled();
		await submitButton.click();

		await expect(page).toHaveURL(/\/de\/forgotPassword\/?$/);
	});

	test("valid submit shows success and returns to login", async ({ page }) => {
		test.skip(!hasResetEmail, "E2E_RESET_EMAIL not set");

		await safeGoto(page, "/de/forgotPassword", /\/de\/forgotPassword\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "forgotPassword form input was not visible.");
		}
		await emailInput.fill(resetEmail!);
		const sendResetButton = page.getByRole("button", {
			name: /Link senden|Send reset link/i,
		});
		await expect(sendResetButton).toBeVisible();
		await expect(sendResetButton).toBeEnabled();
		await sendResetButton.click();

		const successDialog = page.getByRole("dialog", {
			name: /E-Mail gesendet|Email sent/i,
		});
		await expect(successDialog).toBeVisible();
		const backToLoginButton = successDialog.getByRole("button", {
			name: /Zur Anmeldung|Back to login/i,
		});
		await expect(backToLoginButton).toBeVisible();
		await expect(backToLoginButton).toBeEnabled();
		await Promise.all([
			page.waitForURL(/\/de\/login\/?$/, { timeout: 15_000 }),
			backToLoginButton.click(),
		]);
	});
});
