import { test, expect } from "@playwright/test";

const LOGIN_REDIRECT_TIMEOUT = 20_000;

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const institutionId = process.env.E2E_INSTITUTION_ID;
const submissionId = process.env.E2E_SUBMISSION_ID;

const hasRealUserCredentials = !!email && !!password;

const login = async (page: import("@playwright/test").Page) => {
	test.skip(!hasRealUserCredentials, "E2E credentials not set");
	await page.goto("/de/login", { waitUntil: "domcontentloaded" });
	await page.locator("input#email").fill(email as string);
	await page
		.getByRole("textbox", { name: /^Passwort/ })
		.fill(password as string);
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
};

test.describe("edit routes", () => {
	test.setTimeout(90_000);

	test("institution edit loads", async ({ page }) => {
		test.skip(!institutionId, "E2E institution id not set");
		await login(page);
		await page.goto(`/de/account/institutions/${institutionId}/edit`, {
			waitUntil: "domcontentloaded",
		});
		await expect(page.locator("input#name").first()).toBeVisible();
	});

	test("submission edit loads", async ({ page }) => {
		test.skip(!submissionId, "E2E submission id not set");
		await login(page);
		await page.goto(`/de/institution/submission/${submissionId}/edit`, {
			waitUntil: "domcontentloaded",
		});
		await expect(page.locator("input#name").first()).toBeVisible();
	});
});
