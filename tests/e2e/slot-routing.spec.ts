import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../helpers/e2eStableUi";

const institutionId = process.env.E2E_INSTITUTION_ID;
const institutionName = process.env.E2E_INSTITUTION_NAME;
const hasInstitutionData =
	!!institutionId &&
	!!institutionName &&
	!institutionName.includes("example") &&
	!institutionName.includes("Sample");

test.describe("slot routing", () => {
	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("institution sidebar renders for route", async ({ page }) => {
		test.skip(!hasInstitutionData, "E2E institution data not set");

		await page.goto(`/de/map/institution/${institutionId}`, {
			waitUntil: "domcontentloaded",
		});
		await expect(page).toHaveURL(
			new RegExp(`/de/map/institution/${institutionId}/?$`),
		);
		const title = page.locator("#institution-title").first();
		const notFound = page.getByText(/Kulturort nicht gefunden/i).first();
		await expect(title.or(notFound)).toBeVisible({ timeout: 30_000 });
	});
});
