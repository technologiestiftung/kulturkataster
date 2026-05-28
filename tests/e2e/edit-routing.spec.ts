import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../helpers/e2eStableUi";
import { safeGoto } from "../helpers/e2eNavigation";
import { USER_STORAGE_STATE } from "../helpers/e2eAuthState";

const institutionId = process.env.E2E_INSTITUTION_ID;
const submissionId = process.env.E2E_SUBMISSION_ID;
const hasRealUserCredentials =
	!!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD;

test.describe("edit routes", () => {
	test.setTimeout(90_000);
	test.use({ storageState: USER_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("institution edit loads", async ({ page }) => {
		test.skip(!institutionId, "E2E institution id not set");
		await safeGoto(
			page,
			`/de/account/institutions/${institutionId}/edit`,
			new RegExp(`/de/account/institutions/${institutionId}/edit/?$`),
		);
		await expect(page.locator("input#name").first()).toBeVisible();
	});

	test("submission edit loads", async ({ page }) => {
		test.skip(!submissionId, "E2E submission id not set");
		await safeGoto(
			page,
			`/de/account/submissions/${submissionId}/edit`,
			new RegExp(`/de/account/submissions/${submissionId}/edit/?$`),
		);
		await expect(page.locator("input#name").first()).toBeVisible();
	});
});
