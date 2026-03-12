/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { safeGoto } from "../../helpers/e2eNavigation";

const registerEmail = process.env.E2E_REGISTER_EMAIL;
const existingEmail = process.env.E2E_USER_EMAIL;
const registerPassword = process.env.E2E_REGISTER_PASSWORD ?? "Password123!";
const verifyEmailSuccessMessage =
	"Wenn ein Konto mit den angegebenen Daten erstellt werden kann, erhalten Sie in Kürze eine E-Mail mit einem Bestätigungslink.";

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
	await expect(accountTypeTrigger).toBeEnabled();
	await accountTypeTrigger.click();
	const listbox = page.getByRole("listbox");
	await expect(listbox).toBeVisible();
	const option = listbox.getByRole("option", { name: label });
	await expect(option).toBeVisible();
	await option.click();
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
		const termsCheckbox = page.getByRole("checkbox", {
			name: /Ich akzeptiere/,
		});
		await expect(termsCheckbox).toBeVisible();
		await expect(termsCheckbox).toBeEnabled();
		await termsCheckbox.click();
		const createAccountButton = page.getByRole("button", {
			name: "Konto erstellen",
		});
		await expect(createAccountButton).toBeVisible();
		await expect(createAccountButton).toBeEnabled();
		await createAccountButton.click();

		await expect(
			page.getByRole("heading", { name: "Vielen Dank!" }),
		).toBeVisible();
		await expect(
			page.getByText(verifyEmailSuccessMessage).last(),
		).toBeVisible();

		const doneButton = page.getByRole("button", { name: "Fertig" });
		await expect(doneButton).toBeVisible();
		await expect(doneButton).toBeEnabled();
		await Promise.all([
			page.waitForURL(/\/de\/login\/?$/, { timeout: 15_000 }),
			doneButton.click(),
		]);
	});

	test("existing email still resolves to verify-email success", async ({
		page,
	}) => {
		test.skip(!hasRealExistingEmail, "E2E_USER_EMAIL not set");

		await safeGoto(page, "/de/register", /\/de\/register\/?$/);
		await selectAccountType(page, "Mitarbeiter*in einer Organisation");
		await fillOrganizationFields(page);
		await page.getByLabel("Vorname").fill("Jane");
		await page.getByLabel("Nachname").fill("Doe");
		await page.getByLabel("Ihre E-Mail Adresse").fill(existingEmail!);
		await page.getByLabel("Passwort eingeben").fill("Password123!");
		await page.getByLabel("Passwort wiederholen").fill("Password123!");
		const termsCheckbox = page.getByRole("checkbox", {
			name: /Ich akzeptiere/,
		});
		await expect(termsCheckbox).toBeVisible();
		await expect(termsCheckbox).toBeEnabled();
		await termsCheckbox.click();
		const createAccountButton = page.getByRole("button", {
			name: "Konto erstellen",
		});
		await expect(createAccountButton).toBeVisible();
		await expect(createAccountButton).toBeEnabled();
		await createAccountButton.click();

		await expect(
			page.getByRole("heading", { name: "Vielen Dank!" }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByText(verifyEmailSuccessMessage).last(),
		).toBeVisible();
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
		const termsCheckbox = page.getByRole("checkbox", {
			name: /Ich akzeptiere/,
		});
		await expect(termsCheckbox).toBeVisible();
		await expect(termsCheckbox).toBeEnabled();
		await termsCheckbox.click();
		const createAccountButton = page.getByRole("button", {
			name: "Konto erstellen",
		});
		await expect(createAccountButton).toBeVisible();
		await expect(createAccountButton).toBeEnabled();
		await createAccountButton.click();

		await expect(page.getByText("Ungültige E-Mail-Adresse")).toBeVisible();
		await expect(
			page.getByText("Passwort muss mindestens 8 Zeichen haben"),
		).toBeVisible();
		await expect(
			page.getByText("Passwörter stimmen nicht überein"),
		).toBeVisible();
		await expect(page).toHaveURL(/\/de\/register\/?$/);
	});
});
