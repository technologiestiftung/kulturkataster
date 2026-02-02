import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasRealUserCredentials =
	!!email &&
	!!password &&
	!email.includes("example@") &&
	!email.includes("example.") &&
	!["guest123", "example123"].includes(password);

test.describe("auth", () => {
	test("account redirects to login when logged out", async ({ page }) => {
		await page.goto("/account", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/login\/?$/);
	});

	test("login redirects to account", async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");
		await page.goto("/login", { waitUntil: "domcontentloaded" });
		await page.getByLabel("E-Mail").fill(email);
		await page.getByRole("textbox", { name: /^Passwort/ }).fill(password);
		await page.getByRole("button", { name: "Anmelden" }).click();
		await expect(page).toHaveURL(/\/account(\/.*)?$/);
	});
});
