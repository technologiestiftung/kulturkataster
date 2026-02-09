import { test, expect } from "@playwright/test";

const activeEmail = process.env.E2E_USER_EMAIL;
const activePassword = process.env.E2E_USER_PASSWORD;
const pendingEmail = process.env.E2E_USER_EMAIL_2;
const pendingPassword = process.env.E2E_USER_PASSWORD_2;
const hasRealUserCredentials =
	!!activeEmail &&
	!!activePassword &&
	!activeEmail.includes("example@") &&
	!activeEmail.includes("example.") &&
	!["guest123", "example123"].includes(activePassword);
const hasPendingUserCredentials = !!pendingEmail && !!pendingPassword;

test.describe("auth login", () => {
	test("invalid submit shows validation dialog", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.getByRole("button", { name: "Anmelden" }).click();

		const alertDialog = page.getByRole("dialog", { name: "Fehler" });
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

	test("pending user cannot login", async ({ page }) => {
		test.skip(
			!hasPendingUserCredentials || hasRealUserCredentials,
			"E2E pending user credentials not set",
		);

		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.getByLabel("E-Mail").fill(pendingEmail!);
		await page
			.getByRole("textbox", { name: /^Passwort/ })
			.fill(pendingPassword!);
		await page.getByRole("button", { name: "Anmelden" }).click();

		await expect
			.poll(async () => page.url(), { timeout: 15_000 })
			.toMatch(/\/login\/?$/);
	});
});
