import { test, expect } from "@playwright/test";
import { recordNavigationTiming } from "../helpers/navigationTiming";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasRealUserCredentials =
	!!email &&
	!!password &&
	!email.includes("example@") &&
	!email.includes("example.") &&
	!["guest123", "example123"].includes(password);

test.describe("auth", () => {
	const localized = (path: string) => `/de${path}`;

	test("account redirects to login when logged out", async ({
		page,
	}, testInfo) => {
		await page.goto(localized("/account"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "auth-account-to-login");
		await expect(page).toHaveURL(/\/login\/?$/);
	});

	test("account subroutes redirect to login when logged out", async ({
		page,
	}, testInfo) => {
		await page.goto(localized("/account/roles"), {
			waitUntil: "domcontentloaded",
		});
		await recordNavigationTiming(page, testInfo, "auth-account-roles-to-login");
		await expect(page).toHaveURL(/\/login\/?$/);
	});

	test("can switch between login and register", async ({ page }, testInfo) => {
		await page.context().clearCookies();
		await page.goto(localized("/login"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "auth-login-initial");
		const toRegisterLink = page.locator(`a[href="${localized("/register")}"]`);
		await expect(toRegisterLink).toBeVisible();
		await toRegisterLink.click();
		await expect(page).toHaveURL(/\/register\/?$/, { timeout: 30_000 });
		await recordNavigationTiming(page, testInfo, "auth-login-to-register");

		// Verify back-link exists, then navigate directly for deterministic routing.
		await expect(
			page.locator(`a[href="${localized("/login")}"]`).first(),
		).toBeVisible();
		await page.goto(localized("/login"), { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/login\/?$/, { timeout: 15_000 });
		await recordNavigationTiming(page, testInfo, "auth-register-to-login");
	});

	test("login redirects to account", async ({ page }, testInfo) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");
		await page.goto(localized("/login"), { waitUntil: "domcontentloaded" });
		await recordNavigationTiming(page, testInfo, "auth-login-before-submit");
		await page.getByLabel("E-Mail").fill(email);
		await page.getByRole("textbox", { name: /^Passwort/ }).fill(password);
		await page.getByRole("button", { name: "Anmelden" }).click();
		await expect(page).toHaveURL(/\/account(\/.*)?$/);
		await recordNavigationTiming(page, testInfo, "auth-login-to-account");
	});
});
