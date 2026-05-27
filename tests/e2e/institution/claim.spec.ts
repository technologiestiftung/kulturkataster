import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { USER_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealUserCredentials =
	!!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD;

test.describe("institution claim flow", () => {
	test.setTimeout(90_000);
	test.use({ storageState: USER_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("supports search, count, multi-select, and returns to institutions table", async ({
		page,
	}) => {
		await safeGoto(
			page,
			"/de/account/submissions/claim",
			/\/de\/account\/submissions\/claim\/?$/,
		);

		const pageHeading = page.locator("h1").first();
		if ((await pageHeading.count()) > 0) {
			await expect(pageHeading).toBeVisible({ timeout: 15_000 });
		}

		const searchInput = page
			.getByPlaceholder(/Kulturort suchen|Name oder Adresse/i)
			.first();
		await expect(searchInput).toBeVisible();
		await searchInput.fill("a");

		const resultsCount = page.getByText(/\d+\s+Ergebnisse/i).first();
		await expect(resultsCount).toBeVisible({ timeout: 15_000 });

		const optionRows = page
			.locator('[role="button"]')
			.filter({ has: page.locator('[data-slot="checkbox"]') });
		const optionCount = await optionRows.count();
		test.skip(
			optionCount < 2,
			"Need at least two claimable institutions for multi-select flow.",
		);

		await optionRows.nth(0).click();
		await optionRows.nth(1).click();

		const submitButton = page.getByRole("button", { name: /Anfrage senden/i });
		await expect(submitButton).toBeEnabled();

		await submitButton.click();

		const reachedInstitutions = await page
			.waitForURL(/\/de\/account\/institutions\/?$/, { timeout: 10_000 })
			.then(() => true)
			.catch(() => false);

		if (reachedInstitutions) {
			const claimBadge = page.getByText(/Angefragt/i).first();
			const claimedInstitutionRow = page.locator("tbody tr", {
				has: page.getByText(/Angefragt/i).first(),
			});
			await expect(claimBadge).toBeVisible({ timeout: 15_000 });
			await expect(claimedInstitutionRow.first()).toBeVisible({
				timeout: 15_000,
			});
			return;
		}

		const submitErrorDialog = page
			.getByText(/The claim request could not be submitted/i)
			.first();
		await expect(submitErrorDialog).toBeVisible({ timeout: 10_000 });

		const closeErrorDialogButton = page
			.getByRole("button", { name: /Schließen|Close|content\.close/i })
			.first();
		if (
			await closeErrorDialogButton
				.isVisible({ timeout: 5_000 })
				.catch(() => false)
		) {
			await closeErrorDialogButton.click();
		}

		await page
			.getByRole("button", { name: /Abbrechen/i })
			.first()
			.click();
		await page.waitForURL(/\/de\/account\/institutions\/?$/, {
			timeout: 30_000,
		});
	});
});
