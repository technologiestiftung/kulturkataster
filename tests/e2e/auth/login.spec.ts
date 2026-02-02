import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasRealUserCredentials =
	!!email &&
	!!password &&
	!email.includes("example@") &&
	!email.includes("example.") &&
	!["guest123", "example123"].includes(password);

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
		await page.getByLabel("E-Mail").fill(email!);
		await page.getByRole("textbox", { name: /^Passwort/ }).fill(password!);
		await page.getByRole("button", { name: "Anmelden" }).click();
		await expect(page).toHaveURL(/\/account(\/.*)?$/);
	});
});
