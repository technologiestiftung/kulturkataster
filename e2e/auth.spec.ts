import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("auth", () => {
	test("account redirects to login when logged out", async ({ page }) => {
		await page.goto("/account");
		await expect(page).toHaveURL(/\/login\/?$/);
	});

	test("login redirects to account", async ({ page }) => {
		test.skip(!email || !password, "E2E credentials not set");
		await page.goto("/login");
		await page.getByLabel("E-Mail").fill(email);
		await page.getByLabel("Passwort").fill(password);
		await page.getByRole("button", { name: "Anmelden" }).click();
		await expect(page).toHaveURL(/\/account(\/.*)?$/);
	});
});
