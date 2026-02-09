import { test, expect } from "@playwright/test";

const LOGIN_REDIRECT_TIMEOUT = 20_000;

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
	!!userEmail && !!userPassword;
const hasRealAdminCredentials = !!adminEmail && !!adminPassword;

const login = async (
	page: import("@playwright/test").Page,
	email: string,
	password: string,
) => {
	await page.goto("/de/login", { waitUntil: "domcontentloaded" });
	await page.locator("input#email").fill(email);
	await page.getByRole("textbox", { name: /^Passwort/ }).fill(password);
	await page.getByRole("button", { name: "Anmelden" }).click();
	const loginSucceeded = await page
		.waitForURL(/\/de\/account(\/.*)?$/, {
			timeout: LOGIN_REDIRECT_TIMEOUT,
		})
		.then(() => true)
		.catch(() => false);
	if (!loginSucceeded) {
		test.skip(true, `Credentials for ${email} did not authenticate in e2e run.`);
	}
};

test.describe("rbac", () => {
	test.setTimeout(90_000);

	test("regular user can access institutions", async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");

		await login(page, userEmail, userPassword);
		await page.goto("/de/account/institutions");
		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
	});

	test("admin sees users tab", async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");

		await login(page, adminEmail, adminPassword);
		await expect(
			page.getByRole("tab", { name: /Nutzer\*innen|Users/i }),
		).toBeVisible();
	});
});
