import { test, expect } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const hasRealAdminCredentials =
	!!adminEmail &&
	!!adminPassword &&
	!adminEmail.includes("example@") &&
	!adminEmail.includes("example.") &&
	!["guest123", "example123"].includes(adminPassword);

const loginAsAdmin = async (page: import("@playwright/test").Page) => {
	await page.goto("/de/login", { waitUntil: "domcontentloaded" });
	await page.getByLabel("E-Mail").fill(adminEmail);
	await page
		.getByRole("textbox", { name: /^Passwort/ })
		.fill(adminPassword ?? "");
	await page.getByRole("button", { name: "Anmelden" }).click();
	await expect(page).toHaveURL(/\/de\/account(\/.*)?$/);
};

test.describe("dashboard routing, tabs, greeting, and menu actions", () => {
	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await loginAsAdmin(page);
	});

	test("redirects /account to /account/activity and greets current user", async ({
		page,
	}) => {
		await page.goto("/de/account", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/de\/account\/activity\/?$/);
		await expect(page.getByRole("heading", { level: 1 })).toContainText(
			/Willkommen,/,
		);
	});

	test("switches tabs and keeps deep-link after reload", async ({ page }) => {
		const tabRoutes: Array<{ label: string; route: string }> = [
			{ label: "Activity", route: "/de/account/activity" },
			{ label: "Institutions", route: "/de/account/institutions" },
			{ label: "Users", route: "/de/account/users" },
			{ label: "Groups", route: "/de/account/groups" },
			{ label: "Roles", route: "/de/account/roles" },
			{ label: "Categories", route: "/de/account/categories" },
		];

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });

		for (const tab of tabRoutes) {
			await page.getByRole("tab", { name: tab.label }).click();
			await expect(page).toHaveURL(new RegExp(`${tab.route}/?$`));
			await expect(page.getByRole("tab", { name: tab.label })).toHaveAttribute(
				"data-state",
				"active",
			);
		}

		await page.reload();
		await expect(page).toHaveURL(/\/de\/account\/categories\/?$/);
		await expect(page.getByRole("tab", { name: "Categories" })).toHaveAttribute(
			"data-state",
			"active",
		);
	});

	test("shows dashboard menu actions and executes their routing", async ({
		page,
	}) => {
		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });

		const profileSettings = page.getByRole("button", {
			name: "Profileinstellungen",
		});
		const faq = page.getByRole("button", { name: "FAQ" });
		const logout = page.getByRole("button", { name: "Abmelden" });

		await expect(profileSettings).toBeVisible();
		await expect(faq).toBeVisible();
		await expect(logout).toBeVisible();

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await profileSettings.click();
		await expect(page).toHaveURL(/\/de\/account\/edit\/?$/);

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await faq.click();
		await expect(page).toHaveURL(/\/de\/account\/faq\/?$/);

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await logout.click();
		await expect(page).toHaveURL(/\/de\/?$/);

		await page.goto("/de/account/activity", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/de\/login\/?$/);
	});
});
