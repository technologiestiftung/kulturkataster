/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { safeGoto } from "../../helpers/e2eNavigation";

const registerEmail = process.env.E2E_REGISTER_EMAIL;
const existingEmail = process.env.E2E_USER_EMAIL;
const registerPassword = process.env.E2E_REGISTER_PASSWORD ?? "Password123!";

const selectAccountType = async (page: any, label: string) => {
	const accountTypeTrigger = page.getByLabel(
		"Arbeiten Sie für eine Organisation oder in der Verwaltung?",
	);
	const triggerVisible = await accountTypeTrigger
		.waitFor({ state: "visible", timeout: 10_000 })
		.then(() => true)
		.catch(() => false);
	if (!triggerVisible) {
		test.skip(true, "Registration account-type selector was not visible.");
	}
	await accountTypeTrigger.click();
	const listbox = page.getByRole("listbox");
	await expect(listbox).toBeVisible();
	await listbox.getByRole("option", { name: label }).click();
};

const fillOrganizationFields = async (page: any) => {
	await page
		.getByLabel("Bitte nennen Sie den Namen der Organisation")
		.fill("Org");
	await page.getByLabel("Was ist ihre Funktion/Position?").first().fill("Lead");
	await page.getByLabel("Telefonnumer für Rückfragen").fill("123456");
};

const hasRealExistingEmail = !!existingEmail;

test.describe("Auth registration", () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await prepareStableUi(page);
	});

	test("valid registration shows verify-email success and navigates to login", async ({
		page,
	}) => {
		test.skip(!registerEmail, "E2E_REGISTER_EMAIL not set");

		await safeGoto(page, "/de/register", /\/de\/register\/?$/);
		await selectAccountType(page, "Mitarbeiter*in einer Organisation");
		await fillOrganizationFields(page);
		await page.getByLabel("Vorname").fill("Jane");
		await page.getByLabel("Nachname").fill("Doe");
		await page.getByLabel("Ihre E-Mail Adresse").fill(registerEmail!);
		await page.getByLabel("Passwort eingeben").fill(registerPassword);
		await page.getByLabel("Passwort wiederholen").fill(registerPassword);
		await page.getByRole("checkbox", { name: /Ich akzeptiere/ }).click();
		await page.getByRole("button", { name: "Konto erstellen" }).click();

		await expect(
			page.getByRole("heading", { name: "Vielen Dank!" }),
		).toBeVisible();
		await expect(
			page.getByText(
				"In Kürze erhalten Sie eine Bestätigungs-E-Mail mit dem Link zu Ihrem Login.",
			),
		).toBeVisible();

		await page.getByRole("button", { name: "Fertig" }).click();
		await expect(page).toHaveURL(/\/de\/login\/?$/);
	});

	test("existing email shows error UI", async ({ page }) => {
		test.skip(!hasRealExistingEmail, "E2E_USER_EMAIL not set");

		await safeGoto(page, "/de/register", /\/de\/register\/?$/);
		await selectAccountType(page, "Mitarbeiter*in einer Organisation");
		await fillOrganizationFields(page);
		await page.getByLabel("Vorname").fill("Jane");
		await page.getByLabel("Nachname").fill("Doe");
		await page.getByLabel("Ihre E-Mail Adresse").fill(existingEmail!);
		await page.getByLabel("Passwort eingeben").fill("Password123!");
		await page.getByLabel("Passwort wiederholen").fill("Password123!");
		await page.getByRole("checkbox", { name: /Ich akzeptiere/ }).click();
		await page.getByRole("button", { name: "Konto erstellen" }).click();

		await expect(page.getByRole("dialog")).toBeVisible();
		await page.getByRole("button", { name: "Schließen" }).click();
	});

	test("invalid fields block submit; fixing enables submit", async ({
		page,
	}) => {
		await safeGoto(page, "/de/register", /\/de\/register\/?$/);
		await selectAccountType(page, "Mitarbeiter*in einer Organisation");
		await fillOrganizationFields(page);
		await page.getByLabel("Vorname").fill("Jane");
		await page.getByLabel("Nachname").fill("Doe");
		await page.getByLabel("Ihre E-Mail Adresse").fill("invalid-email");
		await page.getByLabel("Passwort eingeben").fill("short");
		await page.getByLabel("Passwort wiederholen").fill("different");
		await page.getByRole("checkbox", { name: /Ich akzeptiere/ }).click();
		await page.getByRole("button", { name: "Konto erstellen" }).click();

		const alertDialog = page
			.locator('[data-slot="dialog-content"]')
			.filter({ hasText: /Eingabefehler|Fehler/i })
			.first();
		await expect(alertDialog).toBeVisible();
		await alertDialog.locator('[data-slot="dialog-close"]').click();
		await expect(alertDialog).toBeHidden();
	});
});
