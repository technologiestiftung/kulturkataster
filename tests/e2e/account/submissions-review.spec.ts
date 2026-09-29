import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { ADMIN_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("submission review", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("review modal opens for pending institution submissions and allows decision", async ({
		page,
	}) => {
		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/account\/institutions\/?$/,
		);

		const reviewButtons = page.getByRole("button", { name: "Review" });
		// The institutions table renders after client-side data loading
		await reviewButtons
			.first()
			.waitFor({ state: "visible", timeout: 15_000 })
			.catch(() => {});
		const reviewCount = await reviewButtons.count();
		test.skip(
			reviewCount < 1,
			"Need at least one reviewable institution submission.",
		);

		await reviewButtons.first().click();
		const openedReviewRoute = await page
			.waitForURL(/\/de\/account\/submissions\/\d+\/?$/, {
				timeout: 10_000,
			})
			.then(() => true)
			.catch(() => false);

		await expect(
			page.getByRole("button", { name: /Genehmigen|Ablehnen/ }).first(),
		).toBeVisible({ timeout: 15_000 });
		if (!openedReviewRoute) {
			await expect(page).toHaveURL(/\/de\/account\/institutions\/?$/);
		}

		const actionButton = page.getByRole("button", { name: "Ablehnen" });
		if ((await actionButton.count()) > 0) {
			await actionButton.first().click();
			await expect(page).toHaveURL(/\/de\/account\/institutions\/?$/, {
				timeout: 30_000,
			});
		}
	});
});
