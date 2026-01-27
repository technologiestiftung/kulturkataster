import { test, expect } from "@playwright/test";

const filterRootSelector = ".Filter-root";
const filterLabelPattern = /Kulturorte filtern/;

test.describe("map overlays", () => {
	test("filter overlay only appears on /map", async ({ page }) => {
		await page.goto("/map");
		const filterButton = page.getByRole("button", { name: filterLabelPattern });
		await expect(filterButton).toBeVisible();
		await filterButton.click();

		await expect(page.locator(filterRootSelector)).toBeVisible({
			timeout: 10_000,
		});

		await page.goto("/list");
		await expect(page.locator(filterRootSelector)).toHaveCount(0);
	});
});
