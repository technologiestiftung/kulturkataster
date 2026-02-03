import { test, expect } from "@playwright/test";

const institutionId = process.env.E2E_INSTITUTION_ID;
const institutionName = process.env.E2E_INSTITUTION_NAME;
const hasInstitutionData =
	!!institutionId &&
	!!institutionName &&
	!institutionName.includes("example") &&
	!institutionName.includes("Sample");

test.describe("slot routing", () => {
	test("institution sidebar renders for route", async ({ page }) => {
		test.skip(!hasInstitutionData, "E2E institution data not set");

		await page.goto(`/map/institution/${institutionId}`, {
			waitUntil: "domcontentloaded",
		});
		await expect(page.locator("#institution-title").first()).toBeVisible({
			timeout: 30_000,
		});
	});
});
