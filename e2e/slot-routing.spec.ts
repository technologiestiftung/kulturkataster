import { test, expect } from "@playwright/test";

const institutionId = process.env.E2E_INSTITUTION_ID;

test.describe("slot routing", () => {
	test("institution sidebar renders for route", async ({ page }) => {
		test.skip(!institutionId, "E2E institution data not set");

		await page.goto(`/institution/${institutionId}`);
		await expect(page.getByText("Kulturort Details")).toBeVisible({
			timeout: 15_000,
		});
	});
});
