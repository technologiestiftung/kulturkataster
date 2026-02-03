import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasRealUserCredentials =
	!!email &&
	!!password &&
	!email.includes("example@") &&
	!email.includes("example.") &&
	!["guest123", "example123"].includes(password);

const login = async (page: import("@playwright/test").Page) => {
	test.skip(!hasRealUserCredentials, "E2E credentials not set");
	await page.goto("/login", { waitUntil: "domcontentloaded" });
	await page.getByLabel("E-Mail").fill(email as string);
	await page
		.getByRole("textbox", { name: /^Passwort/ })
		.fill(password as string);
	await page.getByRole("button", { name: "Anmelden" }).click();
	await expect(page).toHaveURL(/\/account(\/.*)?$/);
};

test.describe("account edit", () => {
	test("edit modal renders for account user", async ({ page }) => {
		await login(page);
		await page.goto("/account/edit", { waitUntil: "domcontentloaded" });
		await expect(
			page.getByRole("heading", { name: "Persönliche Angaben ändern" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Profil löschen" }),
		).toBeVisible();
	});
});
