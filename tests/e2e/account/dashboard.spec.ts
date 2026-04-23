import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { ADMIN_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("dashboard routing, tabs, greeting, and menu actions", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account/activity", /\/de\/account\/activity\/?$/);
		await expect(page.getByRole("tab").first()).toBeVisible({
			timeout: 15_000,
		});
	});

	test("redirects /account to /account/activity and greets current user", async ({
		page,
	}) => {
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
		await expect(page).toHaveURL(/\/de\/account\/activity\/?$/);
		await expect(
			page.getByRole("heading", { name: /Willkommen,/ }),
		).toBeVisible();
	});

	test("switches tabs and keeps deep-link after reload", async ({ page }) => {
		const tabRoutes: Array<{ label: string; route: string; pattern: RegExp }> =
			[
				{
					label: "Aktivität",
					route: "/de/account/activity",
					pattern: /\/de\/account\/activity\/?$/,
				},
				{
					label: "Kulturorte",
					route: "/de/account/institutions",
					pattern: /\/de\/account\/institutions\/?$/,
				},
				{
					label: "Nutzer*innen",
					route: "/de/account/users",
					pattern: /\/de\/account\/users\/?$/,
				},
				{
					label: "Gruppen",
					route: "/de/account/groups",
					pattern: /\/de\/account\/groups\/?$/,
				},
				{
					label: "Rollen",
					route: "/de/account/roles",
					pattern: /\/de\/account\/roles\/?$/,
				},
				{
					label: "Kategorien",
					route: "/de/account/categories",
					pattern: /\/de\/account\/categories\/?$/,
				},
			];

		await safeGoto(page, "/de/account/activity", /\/de\/account\/activity\/?$/);

		let lastVisitedRoute = "/de/account/activity";
		for (const tab of tabRoutes) {
			const tabButton = page.getByRole("tab", { name: tab.label });
			if ((await tabButton.count()) === 0) continue;
			await safeGoto(page, tab.route, tab.pattern);
			await expect(page).toHaveURL(tab.pattern, { timeout: 15_000 });
			await expect(tabButton).toHaveAttribute("data-state", "active");
			lastVisitedRoute = tab.route;
		}

		await page.reload({ waitUntil: "commit" });
		await expect(page).toHaveURL(new RegExp(`${lastVisitedRoute}/?$`), {
			timeout: 15_000,
		});
	});

	test("shows dashboard menu actions and executes their routing", async ({
		page,
	}) => {
		const navigateViaMenuAction = async (buttonName: string) => {
			await safeGoto(
				page,
				"/de/account/activity",
				/\/de\/account\/activity\/?$/,
			);
			const button = page.getByRole("button", { name: buttonName });
			await expect(button).toBeVisible();
			await button.click();
		};

		await navigateViaMenuAction("Profileinstellungen");
		await safeGoto(page, "/de/account/edit", /\/de\/account\/edit\/?$/);
		await expect(
			page.locator("h1:not(.sr-only)", {
				hasText: "Persönliche Angaben ändern",
			}),
		).toBeVisible({ timeout: 10_000 });

		await navigateViaMenuAction("FAQ");
		await safeGoto(page, "/de/account/faq", /\/de\/account\/faq\/?$/);
		await expect(
			page.getByRole("heading", { name: /FAQ|Fragen\s*&\s*Antworten/i }),
		).toBeVisible({ timeout: 15_000 });

		await navigateViaMenuAction("Abmelden");
		await expect(page).toHaveURL(/\/de(?:\/|\/map\/?|\/welcome\/?)?$/, {
			timeout: 15_000,
		});

		await safeGoto(page, "/de/account/activity", /\/de\/account\/activity\/?$/);
		await expect(page).toHaveURL(/\/de\/login\/?$/);
	});
});
