import { test, expect } from "@playwright/test";

const filterRootSelector = ".Filter-root";
const filterLabelPattern = /Kulturorte filtern/;

test.describe("map overlays", () => {
	test("filter overlay only appears on /map", async ({ page }) => {
		await page.goto("/map", { waitUntil: "domcontentloaded" });
		const filterButton = page.getByRole("button", { name: filterLabelPattern });
		await expect(filterButton).toBeVisible();
		await filterButton.click({ force: true });

		await expect(page.locator(filterRootSelector)).toBeVisible({
			timeout: 10_000,
		});

		await page.goto("/list", { waitUntil: "domcontentloaded" });
		await expect(page.locator(filterRootSelector)).toHaveCount(1);
	});
});
