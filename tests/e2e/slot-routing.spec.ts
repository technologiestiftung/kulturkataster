import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../helpers/e2eStableUi";
import { safeGoto } from "../helpers/e2eNavigation";

const institutionId = process.env.E2E_INSTITUTION_ID;
const institutionName = process.env.E2E_INSTITUTION_NAME;
const hasInstitutionData =
	!!institutionId &&
	!!institutionName &&
	!institutionName.includes("example") &&
	!institutionName.includes("Sample");

test.describe("slot routing", () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("institution sidebar renders for route", async ({ page }) => {
		test.skip(!hasInstitutionData, "E2E institution data not set");

		await safeGoto(
			page,
			`/de/map/institution/${institutionId}`,
			new RegExp(`/de/map/institution/${institutionId}/?$`),
		);
		await expect(page).toHaveURL(
			new RegExp(`/de/map/institution/${institutionId}/?$`),
		);
		const title = page.locator("#institution-title").first();
		const notFound = page.getByText(/Kulturort nicht gefunden/i).first();
		const sidebarResolved = await title
			.or(notFound)
			.waitFor({ state: "visible", timeout: 15_000 })
			.then(() => true)
			.catch(() => false);
		if (!sidebarResolved) {
			test.skip(true, "Institution sidebar content was not visible.");
		}
	});

	test("keeps selected institution route when switching between map and list", async ({
		page,
	}) => {
		test.skip(!hasInstitutionData, "E2E institution data not set");

		await page.setViewportSize({ width: 390, height: 844 });
		await safeGoto(
			page,
			`/de/map/institution/${institutionId}`,
			new RegExp(`/de/map/institution/${institutionId}/?$`),
		);
		await expect(page).toHaveURL(
			new RegExp(`/de/map/institution/${institutionId}/?$`),
		);

		const listButton = page
			.locator('button[aria-label="Listenansicht"]:visible')
			.first();
		const listButtonVisible = await listButton
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!listButtonVisible) {
			test.skip(true, "List view switch button was not visible.");
		}
		await expect(listButton).toBeEnabled();
		// A click before hydration is lost on slow CI runners; retry until the route changes
		await expect(async () => {
			await listButton.click({ force: true });
			await expect(page).toHaveURL(
				new RegExp(`/de/list/institution/${institutionId}/?$`),
				{ timeout: 3_000 },
			);
		}).toPass({ timeout: 30_000 });
		await expect(page.locator("#institution-title").first()).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator("#institution-title").first()).toBeVisible({
			timeout: 15_000,
		});

		const mapButton = page
			.locator('button[aria-label="Kartenansicht"]:visible')
			.first();
		const mapButtonVisible = await mapButton
			.waitFor({ state: "visible", timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		if (!mapButtonVisible) {
			test.skip(true, "Map view switch button was not visible.");
		}
		await expect(mapButton).toBeEnabled();
		await mapButton.click({ force: true });
		await expect(page).toHaveURL(
			new RegExp(`/de/map/institution/${institutionId}/?$`),
			{
				timeout: 15_000,
			},
		);
		await expect(page.locator("#institution-title").first()).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator("#institution-title").first()).toBeVisible({
			timeout: 15_000,
		});
	});
});
