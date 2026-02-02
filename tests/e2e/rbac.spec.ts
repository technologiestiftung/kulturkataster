import { test, expect } from "@playwright/test";

const userEmail = process.env.E2E_USER_EMAIL || "";
const userPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL || "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

if (!userEmail || !userPassword || !userEmail.includes("@")) {
	console.warn("E2E user credentials are not set or invalid");
}

if (!adminEmail || !adminPassword || !adminEmail.includes("@")) {
	console.warn("E2E admin credentials are not set or invalid");
}

const hasRealUserCredentials =
	!!userEmail &&
	!!userPassword &&
	!userEmail.includes("example@") &&
	!userEmail.includes("example.") &&
	!["guest123", "example123"].includes(userPassword);
const hasRealAdminCredentials =
	!!adminEmail &&
	!!adminPassword &&
	!adminEmail.includes("example@") &&
	!adminEmail.includes("example.") &&
	!["guest123", "example123"].includes(adminPassword);

const login = async (
	page: import("@playwright/test").Page,
	email: string,
	password: string,
) => {
	await page.goto("/login", { waitUntil: "domcontentloaded" });
	await page.getByLabel("E-Mail").fill(email);
	await page.getByRole("textbox", { name: /^Passwort/ }).fill(password);
	await page.getByRole("button", { name: "Anmelden" }).click();
	await expect(page).toHaveURL(/\/account(\/.*)?$/);
};

test.describe("rbac", () => {
	test("regular user can access institutions", async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");

		await login(page, userEmail, userPassword);
		await page.goto("/account/institutions");
		await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
	});

	test("admin sees users tab", async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");

		await login(page, adminEmail, adminPassword);
		await expect(page.getByRole("tab", { name: "Users" })).toBeVisible();
	});
});
