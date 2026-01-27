import { test, expect } from "@playwright/test";

const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const login = async (
	page: import("@playwright/test").Page,
	email: string,
	password: string,
) => {
	await page.goto("/login");
	await page.getByLabel("E-Mail").fill(email);
	await page.getByLabel("Passwort").fill(password);
	await page.getByRole("button", { name: "Anmelden" }).click();
	await expect(page).toHaveURL(/\/account(\/.*)?$/);
};

test.describe("rbac", () => {
	test("regular user can access institutions", async ({ page }) => {
		test.skip(!userEmail || !userPassword, "E2E user credentials not set");

		await login(page, userEmail, userPassword);
		await page.goto("/account/institutions");
		await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
	});

	test("admin sees users tab", async ({ page }) => {
		test.skip(!adminEmail || !adminPassword, "E2E admin credentials not set");

		await login(page, adminEmail, adminPassword);
		await expect(page.getByRole("tab", { name: "Users" })).toBeVisible();
	});
});
