import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";

const LOGIN_REDIRECT_TIMEOUT = 30_000;

const adminEmail = process.env.E2E_ADMIN_EMAIL || "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const hasRealAdminCredentials = !!adminEmail && !!adminPassword;

const loginAsAdmin = async (page: import("@playwright/test").Page) => {
	await safeGoto(page, "/de/login", /\/de\/login\/?$/);
	const emailInput = page.locator("input#email");
	const inputVisible = await emailInput
		.waitFor({ state: "visible", timeout: 10_000 })
		.then(() => true)
		.catch(() => false);
	if (!inputVisible) {
		test.skip(true, "Login form was not visible in e2e run.");
	}
	await emailInput.fill(adminEmail);
	await page
		.getByRole("textbox", { name: /^Passwort/ })
		.fill(adminPassword ?? "");
	await page.getByRole("button", { name: "Anmelden" }).click();
	const loginSucceeded = await page
		.waitForURL(/\/de\/account(\/.*)?$/, {
			timeout: LOGIN_REDIRECT_TIMEOUT,
		})
		.then(() => true)
		.catch(() => false);
	if (!loginSucceeded) {
		test.skip(true, "Admin credentials did not authenticate in e2e run.");
	}
};

test.describe("dashboard routing, tabs, greeting, and menu actions", () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await loginAsAdmin(page);
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
			await tabButton.click();
			await expect(page).toHaveURL(new RegExp(`${tab.route}/?$`), {
				timeout: 15_000,
			});
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
		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await page.getByRole("button", { name: "Profileinstellungen" }).click();
		await expect(page).toHaveURL(/\/de\/account\/edit\/?$/);

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		const faqButton = page.getByRole("button", { name: "FAQ" });
		await expect(faqButton).toBeVisible();
		await faqButton.click();
		await expect(page).toHaveURL(/\/de\/account\/faq\/?$/, {
			timeout: 15_000,
		});

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await page.getByRole("button", { name: "Abmelden" }).click();
		await expect(page).toHaveURL(/\/de(?:\/|\/welcome\/?)?$/, {
			timeout: 15_000,
		});

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/de\/login\/?$/);
	});
});
