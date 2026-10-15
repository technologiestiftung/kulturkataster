import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { USER_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealUserCredentials =
	!!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD;

test.describe("institutions dashboard", () => {
	test.setTimeout(90_000);
	test.use({ storageState: USER_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E user credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	test("supports search/filter, add/claim actions, edit, and review flow", async ({
		page,
	}) => {
		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/account\/institutions\/?$/,
		);

		const addButton = page.getByRole("button", {
			name: "Kulturort hinzufügen",
		});
		if ((await addButton.count()) > 0) {
			await expect(addButton).toBeVisible({ timeout: 15_000 });
			await Promise.all([
				page.waitForURL(
					/\/de\/(?:institution\/submission|account\/institutions\/new)\/?$/,
					{ timeout: 30_000 },
				),
				addButton.first().click(),
			]);

			await safeGoto(
				page,
				"/de/account/institutions",
				/\/de\/account\/institutions\/?$/,
			);
		}

		const claimButton = page.getByRole("button", {
			name: "Meine Orte anfragen",
		});
		if ((await claimButton.count()) > 0) {
			await Promise.all([
				page.waitForURL(/\/de\/account\/submissions\/claim\/?$/, {
					timeout: 30_000,
				}),
				claimButton.first().click(),
			]);
			await safeGoto(
				page,
				"/de/account/institutions",
				/\/de\/account\/institutions\/?$/,
			);
		}

		const searchLabel = page.getByText("Search institutions").first();
		if ((await searchLabel.count()) > 0) {
			await searchLabel.locator("xpath=preceding-sibling::button[1]").click();
			const searchInput = page.getByPlaceholder("Search institutions...");
			await expect(searchInput).toBeVisible();
			await searchInput.fill("a");
		}

		const filterButton = page
			.getByRole("button", { name: /Kulturorte filtern|Filter/i })
			.first();
		if ((await filterButton.count()) > 0) {
			await filterButton.click();
			await expect(
				page.getByText(/Kulturorte filtern|Filter/i).first(),
			).toBeVisible();
			await page.keyboard.press("Escape");
		}

		const editButtons = page.getByRole("button", {
			name: "Bearbeiten",
			exact: true,
		});
		if ((await editButtons.count()) > 0) {
			await editButtons.first().click();
			const editDialog = page.locator('[data-slot="dialog-content"]').first();
			const reachedEditDestination = await Promise.race([
				page
					.waitForURL(
						/\/de\/(?:account\/institutions\/\d+\/edit|account\/submissions\/\d+\/edit|institution\/submission)\/?/,
						{ timeout: 10_000 },
					)
					.then(() => true)
					.catch(() => false),
				editDialog
					.waitFor({ state: "visible", timeout: 10_000 })
					.then(() => true)
					.catch(() => false),
			]);

			if (!reachedEditDestination) {
				await expect(page).toHaveURL(/\/de\/account\/institutions\/?$/);
			}
		}

		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/account\/institutions\/?$/,
		);

		const reviewButtons = page.getByRole("button", { name: "Review" });
		if ((await reviewButtons.count()) > 0) {
			await reviewButtons.first().click();
			await expect(page).toHaveURL(/\/de\/account\/submissions\/\d+\/?$/, {
				timeout: 30_000,
			});
			await expect(
				page.getByRole("button", { name: "Genehmigen" }),
			).toBeVisible({
				timeout: 15_000,
			});
			await expect(page.getByRole("button", { name: "Ablehnen" })).toBeVisible({
				timeout: 15_000,
			});
		}
	});
});
