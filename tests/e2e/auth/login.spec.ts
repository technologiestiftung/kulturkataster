import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";

const activeEmail = process.env.E2E_USER_EMAIL;
const activePassword = process.env.E2E_USER_PASSWORD;
const bannedEmail =
	process.env.E2E_BANNED_USER_EMAIL ?? process.env.E2E_USER_EMAIL_4;
const bannedPassword =
	process.env.E2E_BANNED_USER_PASSWORD ?? process.env.E2E_USER_PASSWORD_4;

const isRealCredential = (email?: string, password?: string) =>
	!!email &&
	!!password &&
	!email.includes("example@") &&
	!email.includes("example.") &&
	!["guest123", "example123"].includes(password);

const hasRealUserCredentials = isRealCredential(activeEmail, activePassword);
const hasBannedUserCredentials =
	isRealCredential(bannedEmail, bannedPassword) && bannedEmail !== activeEmail;

test.describe("auth login", () => {
	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	const assertRejectedLogin = async (
		page: import("@playwright/test").Page,
		email: string,
		password: string,
		expectedErrorFragment?: string,
	) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.getByLabel("E-Mail").fill(email);
		await page.getByRole("textbox", { name: /^Passwort/ }).fill(password);
		await page.getByRole("button", { name: "Anmelden" }).click();

		// Hard fail if authentication succeeds and reaches account.
		await expect(page).not.toHaveURL(/\/account(\/.*)?$/, { timeout: 15_000 });
		await expect(page).toHaveURL(/\/login\/?$/, { timeout: 15_000 });

		const alertDialog = page.getByRole("dialog", { name: "Eingabefehler" });
		await expect(alertDialog).toBeVisible({ timeout: 15_000 });
		if (expectedErrorFragment) {
			await expect(alertDialog).toContainText(expectedErrorFragment);
		}
	};

	test("invalid submit shows validation dialog", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.getByLabel("E-Mail").fill("invalid-email");
		await page.getByRole("textbox", { name: /^Passwort/ }).fill("x");
		await page.getByRole("button", { name: "Anmelden" }).click();

		const alertDialog = page
			.locator('[data-slot="dialog-content"]')
			.filter({ hasText: /Eingabefehler|Fehler/i })
			.first();
		await expect(alertDialog).toBeVisible();
		await alertDialog.locator('[data-slot="dialog-close"]').click();
		await expect(alertDialog).toBeHidden();
	});

	test("valid login redirects to account", async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E credentials not set");

		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.getByLabel("E-Mail").fill(activeEmail!);
		await page
			.getByRole("textbox", { name: /^Passwort/ })
			.fill(activePassword!);
		await page.getByRole("button", { name: "Anmelden" }).click();
		await expect(page).toHaveURL(/\/account(\/.*)?$/);
	});

	test("banned user cannot login", async ({ page }) => {
		test.skip(
			!hasBannedUserCredentials,
			"E2E banned user credentials not set",
		);

		await assertRejectedLogin(
			page,
			bannedEmail!,
			bannedPassword!,
			"noch nicht freigeschaltet",
		);
	});
});
