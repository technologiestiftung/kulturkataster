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
		const title = page.locator("#institution-title");
		if (await title.count()) {
			await expect(title.first()).toContainText(institutionName!);
		} else {
			await expect(page.locator(`text=${institutionName}`).first()).toBeVisible(
				{
					timeout: 15_000,
				},
			);
		}
	});
});
