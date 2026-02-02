import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const institutionId = process.env.E2E_INSTITUTION_ID;
const submissionId = process.env.E2E_SUBMISSION_ID;

const hasRealUserCredentials =
	!!email &&
	!!password &&
	!email.includes("example@") &&
	!email.includes("example.") &&
	!["guest123", "example123"].includes(password);

const login = async (page: import("@playwright/test").Page) => {
	test.skip(!hasRealUserCredentials, "E2E credentials not set");
	await page.goto("/login", { waitUntil: "domcontentloaded" });
	await page.getByLabel("E-Mail").fill(email as string);
	await page
		.getByRole("textbox", { name: /^Passwort/ })
		.fill(password as string);
	await page.getByRole("button", { name: "Anmelden" }).click();
	await expect(page).toHaveURL(/\/account(\/.*)?$/);
};

test.describe("edit routes", () => {
	test("institution edit loads", async ({ page }) => {
		test.skip(!institutionId, "E2E institution id not set");
		await login(page);
		await page.goto(`/account/institutions/${institutionId}/edit`, {
			waitUntil: "domcontentloaded",
		});
		await expect(page.locator("input#name").first()).toBeVisible();
	});

	test("submission edit loads", async ({ page }) => {
		test.skip(!submissionId, "E2E submission id not set");
		await login(page);
		await page.goto(`/institution/submission/${submissionId}/edit`, {
			waitUntil: "domcontentloaded",
		});
		await expect(page.locator("input#name").first()).toBeVisible();
	});
});
