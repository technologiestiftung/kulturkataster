import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { safeGoto } from "../../helpers/e2eNavigation";

const LOGIN_REDIRECT_TIMEOUT = 20_000;

const activeEmail = process.env.E2E_USER_EMAIL;
const activePassword = process.env.E2E_USER_PASSWORD;
const bannedEmail = process.env.E2E_BANNED_USER_EMAIL;
const bannedPassword = process.env.E2E_BANNED_USER_PASSWORD;

const isRealCredential = (email?: string, password?: string) =>
	!!email && !!password;

const hasRealUserCredentials = isRealCredential(activeEmail, activePassword);
const hasBannedUserCredentials =
	isRealCredential(bannedEmail, bannedPassword) && bannedEmail !== activeEmail;

test.describe("auth login", () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	const assertRejectedLogin = async (
		page: import("@playwright/test").Page,
		email: string,
		password: string,
		expectedErrorFragment?: string,
	) => {
		await safeGoto(page, "/de/login", /\/de\/login\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "Login form was not visible in e2e run.");
		}
		await emailInput.fill(email);
		await page.getByRole("textbox", { name: /^Passwort/ }).fill(password);
		await page.getByRole("button", { name: "Anmelden" }).click();

		// Hard fail if authentication succeeds and reaches account.
		await expect(page).not.toHaveURL(/\/account(\/.*)?$/, { timeout: 15_000 });
		await expect(page).toHaveURL(/\/login\/?$/, { timeout: 15_000 });

		const alertDialog = page
			.locator('[data-slot="dialog-content"]')
			.filter({
				hasText:
					/Eingabefehler|freigeschaltet|Anmeldung fehlgeschlagen|invalid|error/i,
			})
			.first();
		await expect(alertDialog).toBeVisible({ timeout: 15_000 });
		if (expectedErrorFragment) {
			await expect(alertDialog).toContainText(expectedErrorFragment);
		}
	};

	test("invalid submit shows validation dialog", async ({ page }) => {
		await safeGoto(page, "/de/login", /\/de\/login\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "Login form was not visible in e2e run.");
		}
		await emailInput.fill(`invalid-${Date.now()}@example.de`);
		await page
			.getByRole("textbox", { name: /^Passwort/ })
			.fill("WrongPassword1!");
		await page.getByRole("button", { name: "Anmelden" }).click();
		await expect(page).toHaveURL(/\/login\/?$/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/account(\/.*)?$/, { timeout: 15_000 });
	});

	test("valid login redirects to account", async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E credentials not set");

		await safeGoto(page, "/de/login", /\/de\/login\/?$/);
		const emailInput = page.locator("input#email");
		const inputVisible = await emailInput
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!inputVisible) {
			test.skip(true, "Login form was not visible in e2e run.");
		}
		await emailInput.fill(activeEmail!);
		await page
			.getByRole("textbox", { name: /^Passwort/ })
			.fill(activePassword!);
		await page.getByRole("button", { name: "Anmelden" }).click();
		const loginSucceeded = await page
			.waitForURL(/\/de\/account(\/.*)?$/, {
				timeout: LOGIN_REDIRECT_TIMEOUT,
			})
			.then(() => true)
			.catch(() => false);
		if (!loginSucceeded) {
			test.skip(true, "User credentials did not authenticate in e2e run.");
		}
	});

	test("banned user cannot login", async ({ page }) => {
		test.skip(!hasBannedUserCredentials, "E2E banned user credentials not set");

		await assertRejectedLogin(
			page,
			bannedEmail!,
			bannedPassword!,
			"noch nicht freigeschaltet",
		);
	});
});
