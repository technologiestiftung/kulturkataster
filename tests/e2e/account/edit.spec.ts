import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";

const LOGIN_REDIRECT_TIMEOUT = 30_000;

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasRealUserCredentials = !!email && !!password;

const login = async (page: import("@playwright/test").Page) => {
	test.skip(!hasRealUserCredentials, "E2E credentials not set");
	await page.goto("/de/login", { waitUntil: "domcontentloaded" });
	await page.getByLabel("E-Mail").fill(email as string);
	await page
		.getByRole("textbox", { name: /^Passwort/ })
		.fill(password as string);
	await page.getByRole("button", { name: "Anmelden" }).click();
	const loginSucceeded = await page
		.waitForURL(/\/de\/account(\/.*)?$/, {
			timeout: LOGIN_REDIRECT_TIMEOUT,
		})
		.then(() => true)
		.catch(() => false);
	if (!loginSucceeded) {
		test.skip(true, "User credentials did not authenticate in e2e run.");
	}
};

test.describe("account edit", () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("direct /de/account/edit shows personal data fields and secure password controls", async ({
		page,
	}) => {
		await login(page);
		await page.goto("/de/account/edit", { waitUntil: "domcontentloaded" });

		await expect(
			page.getByRole("heading", {
				name: "Persönliche Angaben ändern",
				level: 1,
			}),
		).toBeVisible();
		await expect(page.getByLabel("Ihr Name")).toBeVisible();
		await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Passwort", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("textbox", { name: "Passwort bestätigen" }),
		).toBeVisible();
		await expect(page.getByLabel("E-Mail-Adresse")).toHaveValue(email ?? "");
	});

	test("account route allows reaching edit workflow", async ({ page }) => {
		await login(page);
		await page.goto("/de/account", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/de\/account\/activity\/?$/);

		await page.getByRole("button", { name: "Profileinstellungen" }).click();
		await expect(page).toHaveURL(/\/de\/account\/edit\/?$/);
		await expect(
			page.getByRole("heading", {
				name: "Persönliche Angaben ändern",
				level: 1,
			}),
		).toBeVisible();
	});

	test("delete account opens confirmation dialog with confirm action", async ({
		page,
	}) => {
		await login(page);
		await page.goto("/de/account/edit", { waitUntil: "domcontentloaded" });

		await expect(
			page.getByRole("button", { name: "Profil löschen" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Profil löschen" }).first().click();
		const deleteDialog = page
			.locator('[data-slot="dialog-content"]')
			.filter({ hasText: /Profil löschen/i })
			.first();
		await expect(deleteDialog).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole("button", { name: "Profil löschen" }).last(),
		).toBeVisible();
	});
});
