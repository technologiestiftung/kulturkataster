import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const institutionId = process.env.E2E_INSTITUTION_ID;
const submissionId = process.env.E2E_SUBMISSION_ID;

const login = async (page: import("@playwright/test").Page) => {
	test.skip(!email || !password, "E2E credentials not set");
	await page.goto("/login");
	await page.getByLabel("E-Mail").fill(email as string);
	await page.getByLabel("Passwort").fill(password as string);
	await page.getByRole("button", { name: "Anmelden" }).click();
	await expect(page).toHaveURL(/\/account(\/.*)?$/);
};

test.describe("edit routes", () => {
	test("institution edit loads", async ({ page }) => {
		test.skip(!institutionId, "E2E institution id not set");
		await login(page);
		await page.goto(`/account/institutions/${institutionId}/edit`);
		await expect(page.locator("input#name").first()).toBeVisible();
	});

	test("submission edit loads", async ({ page }) => {
		test.skip(!submissionId, "E2E submission id not set");
		await login(page);
		await page.goto(`/institution/submission/${submissionId}/edit`);
		await expect(page.locator("input#name").first()).toBeVisible();
	});
});
