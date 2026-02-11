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
		await expect(page.getByRole("tab").first()).toBeVisible({ timeout: 15_000 });
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
		const tabRoutes: Array<{ label: string; route: string }> = [
			{ label: "Aktivität", route: "/de/account/activity" },
			{ label: "Kulturorte", route: "/de/account/institutions" },
			{ label: "Nutzer*innen", route: "/de/account/users" },
			{ label: "Gruppen", route: "/de/account/groups" },
			{ label: "Rollen", route: "/de/account/roles" },
			{ label: "Kategorien", route: "/de/account/categories" },
		];

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });

		let lastVisitedRoute = "/de/account/activity";
		for (const tab of tabRoutes) {
			const tabButton = page.getByRole("tab", { name: tab.label });
			if ((await tabButton.count()) === 0) continue;
			await expect(tabButton).toBeVisible();
			await expect(tabButton).toBeEnabled();
			await Promise.all([
				page.waitForURL(new RegExp(`${tab.route}/?$`), { timeout: 15_000 }),
				tabButton.click(),
			]);
			await expect(tabButton).toHaveAttribute("data-state", "active");
			lastVisitedRoute = tab.route;
		}

		await page.reload();
		await expect(page).toHaveURL(new RegExp(`${lastVisitedRoute}/?$`), {
			timeout: 15_000,
		});
	});

	test("shows dashboard menu actions and executes their routing", async ({
		page,
	}) => {
		const navigateViaMenuAction = async (
			buttonName: string,
			targetUrl: RegExp,
			timeout = 15_000,
		) => {
			await page.goto("/de/account/activity", {
				waitUntil: "domcontentloaded",
			});
			const button = page.getByRole("button", { name: buttonName });
			await expect(button).toBeVisible();
			await Promise.all([
				page.waitForURL(targetUrl, { timeout }),
				button.click(),
			]);
		};

		await navigateViaMenuAction(
			"Profileinstellungen",
			/\/de\/account\/edit\/?$/,
		);
		await expect(
			page.getByRole("heading", {
				name: "Persönliche Angaben ändern",
				level: 1,
			}),
		).toBeVisible();

		await navigateViaMenuAction("FAQ", /\/de\/account\/faq\/?$/, 30_000);
		await expect(
			page.getByRole("heading", { name: "Kontakt zum Support" }),
		).toBeVisible({ timeout: 15_000 });

		await navigateViaMenuAction("Abmelden", /\/de(?:\/|\/welcome\/?)?$/);

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/de\/login\/?$/);
	});
});
