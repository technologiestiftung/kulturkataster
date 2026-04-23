import { test, expect } from "@playwright/test";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { safeGoto } from "../../helpers/e2eNavigation";
import { USER_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealUserCredentials =
	!!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD;

test.describe("institution submission wizard", () => {
	test.setTimeout(90_000);
	test.use({ storageState: USER_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealUserCredentials, "E2E credentials not set");
		await prepareStableUi(page);
		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/(?:account\/institutions|login)(?:\/)?$/,
		);
		if (/\/de\/login(?:\/)?$/.test(page.url())) {
			test.skip(
				true,
				"Authenticated storage state is unavailable (global setup likely fell back to anonymous).",
			);
		}
		await safeGoto(
			page,
			"/de/institution/submission",
			/\/de\/institution\/submission\/?$/,
		);
	});

	const waitForPostSubmitOutcome = async (
		page: import("@playwright/test").Page,
	) => {
		const postSubmitRoutePattern =
			/\/de\/(?:(?:account(?:\/institutions|\/activity)?|map|login|welcome)(?:\/)?|institution\/?\?thankyou=(?:1|true))$/;
		const submitButton = await getWizardSubmitButton(page);
		await expect(
			submitButton,
			"Wizard submit button #institution-draft-submit-button should exist exactly once.",
		).toHaveCount(1, { timeout: 15_000 });

		await Promise.race([
			expect(page).toHaveURL(postSubmitRoutePattern, { timeout: 45_000 }),
			(async () => {
				await expect(submitButton).toBeHidden({ timeout: 45_000 });
			})(),
		]);
	};

	const getWizardSubmitButton = async (
		page: import("@playwright/test").Page,
	): Promise<import("@playwright/test").Locator> => {
		const submitButton = page.locator("#institution-draft-submit-button");
		await expect(
			submitButton,
			"Wizard submit button #institution-draft-submit-button should exist exactly once.",
		).toHaveCount(1, { timeout: 15_000 });
		return submitButton;
	};

	const fillById = async (
		page: import("@playwright/test").Page,
		id: string,
		value: string,
	) => {
		const field = page.locator(`[id="${id}"]`).first();
		if ((await field.count()) === 0) return;
		if (!(await field.isVisible().catch(() => false))) return;
		await field.fill(value);
	};

	const checkById = async (
		page: import("@playwright/test").Page,
		id: string,
	) => {
		const checkbox = page.locator(`[id="${id}"]`).first();
		if ((await checkbox.count()) === 0) return;
		if (!(await checkbox.isVisible().catch(() => false))) return;
		const state = await checkbox.getAttribute("data-state");
		if (state !== "checked") {
			await checkbox.click();
		}
	};

	const selectFirstOptionById = async (
		page: import("@playwright/test").Page,
		id: string,
	) => {
		const trigger = page.locator(`[id="${id}"]`).first();
		if ((await trigger.count()) === 0) return;
		if (!(await trigger.isVisible().catch(() => false))) return;
		await trigger.click();
		const option = page
			.locator('[data-slot="select-content"]:visible')
			.last()
			.locator('[role="option"]:visible')
			.first();
		const hasVisibleOption = await option.isVisible().catch(() => false);
		if (hasVisibleOption) {
			await option.scrollIntoViewIfNeeded();
			await option.click({ force: true });
			return;
		}
		// Fallback for flaky portal rendering: select first item via keyboard.
		await trigger.focus();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
	};

	const openAllAccordions = async (
		page: import("@playwright/test").Page,
		formSelector: string,
	) => {
		const form = page.locator(formSelector);
		const triggers = form.locator('[data-slot="accordion-trigger"]');
		const count = await triggers.count();
		for (let i = 0; i < count; i += 1) {
			const trigger = triggers.nth(i);
			if (!(await trigger.isVisible().catch(() => false))) continue;
			const state = await trigger.getAttribute("data-state");
			if (state !== "open") {
				await trigger.click();
			}
		}
	};

	test("blocks forward stepper jumps when required fields are missing", async ({
		page,
	}) => {
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();

		await page.getByRole("button", { name: "Go to step 2" }).click();
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();

		// Even with valid current step, jumping multiple steps ahead is blocked.
		await fillById(page, "name", "E2E Validation Institution");
		await page.getByRole("button", { name: "Go to step 5" }).click();
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();

		await page.getByRole("button", { name: "Go to step 2" }).click();
		await expect(page.getByText(/Schritt 2 \/ 5/)).toBeVisible();
	});

	test("supports lng/lat-only draft and can submit for review", async ({
		page,
	}) => {
		const uniqueName = `E2E LatLng ${Date.now()}`;

		await page.getByLabel(/Kulturort\*/i).fill(uniqueName);
		await fillById(page, "address.lat", "52.520008");
		await fillById(page, "address.lng", "13.404954");

		await page
			.locator('form#institution-basic-form button[type="submit"]')
			.click();
		await expect(page.getByText(/Schritt 2 \/ 5/)).toBeVisible();
		await expect(page.locator("form#institution-category-form")).toBeVisible();
		await page
			.getByLabel("Neue Kategorie(n) vorschlagen")
			.fill(`E2E Kategorie ${Date.now()}`);
		await page
			.locator('form#institution-category-form button[type="submit"]')
			.click();
		await expect(page.getByText(/Schritt 3 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await expect(
			page.locator("form#institution-shared-use-form"),
		).toBeVisible();
		await page
			.locator('form#institution-shared-use-form button[type="submit"]')
			.click();
		await expect(page.getByText(/Schritt 4 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator("form#institution-contact-form")).toBeVisible();
		await page
			.locator('form#institution-contact-form button[type="submit"]')
			.click();
		const submitButton = await getWizardSubmitButton(page);
		await expect(submitButton).toBeVisible({ timeout: 15_000 });
		await expect(
			page
				.locator("#institution-title")
				.filter({ hasText: uniqueName })
				.first(),
		).toBeVisible();
		await expect(page.getByText(/Kontaktperson Vorname/i)).toHaveCount(0);
		await expect(
			page.getByText("contact@example.com", { exact: false }),
		).toHaveCount(0);

		await submitButton.click();
		await waitForPostSubmitOutcome(page);
	});

	test("supports selecting an existing institution, changing details, and sending update request", async ({
		page,
	}) => {
		await safeGoto(
			page,
			"/de/institution/submission/select",
			/\/de\/institution\/submission\/select\/?$/,
		);

		const optionRows = page
			.locator('[role="button"]')
			.filter({ has: page.locator('[data-slot="checkbox"]') });
		const optionCount = await optionRows.count();
		test.skip(
			optionCount < 1,
			"Need at least one existing institution in select list.",
		);

		const originalName = (
			await optionRows.nth(0).locator("span").first().innerText()
		).trim();
		await optionRows.nth(0).click();

		await expect(page).toHaveURL(/\/de\/institution\/submission\/?$/, {
			timeout: 15_000,
		});
		const submitButton = await getWizardSubmitButton(page);
		await expect(submitButton).toBeVisible({ timeout: 15_000 });

		const editButtons = page.getByRole("button", { name: "Edit" });
		if ((await editButtons.count()) > 0) {
			await editButtons.first().click();
			const nameInput = page.getByLabel("Name");
			await expect(nameInput).toBeVisible({ timeout: 15_000 });
			const updatedName = `${originalName} (E2E Update)`;
			await nameInput.fill(updatedName);
			await page.getByRole("button", { name: "Änderungen speichern" }).click();
			await expect(
				page.getByText(originalName, { exact: false }).first(),
			).toBeVisible();
			await expect(
				page.getByText(updatedName, { exact: false }).first(),
			).toBeVisible();
		}

		await submitButton.click();
		await expect(page).toHaveURL(/\/de\/institution\/?\?thankyou=1$/, {
			timeout: 45_000,
		});
		await expect(
			page.getByRole("heading", { name: "Vielen Dank für Ihre Einreichung" }),
		).toBeVisible({ timeout: 15_000 });
	});

	test("fills a detailed multi-step draft and submits it for review", async ({
		page,
	}) => {
		const uniqueName = `E2E Full Draft ${Date.now()}`;

		// Step 1: basic details
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();
		await fillById(page, "name", uniqueName);
		await fillById(page, "address.lat", "52.520008");
		await fillById(page, "address.lng", "13.404954");
		await page
			.locator('form#institution-basic-form button[type="submit"]')
			.click();

		// Step 2: category step
		await expect(page.getByText(/Schritt 2 \/ 5/)).toBeVisible();
		await expect(page.locator("form#institution-category-form")).toBeVisible();
		await page
			.getByLabel("Neue Kategorie(n) vorschlagen")
			.fill(`E2E Kategorie ${Date.now()}`);
		await page
			.locator('form#institution-category-form button[type="submit"]')
			.click();

		// Step 3: additional information
		await expect(page.getByText(/Schritt 3 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await expect(
			page.locator("form#institution-shared-use-form"),
		).toBeVisible();
		const yesOption = page.getByRole("radio", { name: "Ja" });
		if (await yesOption.isVisible().catch(() => false)) {
			await yesOption.click();
		}
		await page
			.locator('form#institution-shared-use-form button[type="submit"]')
			.click();

		// Step 4: contact information
		await expect(page.getByText(/Schritt 4 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator("form#institution-contact-form")).toBeVisible();
		await page.locator('[id="works_for_organization-boolean:true"]').click();
		await expect(
			page.locator('[id="consent_contact_listing-boolean:true"]'),
		).toBeVisible();
		await page.locator('[id="consent_contact_listing-boolean:true"]').click();
		await page.getByLabel("Ansprechperson Vorname").fill("Max");
		await page.getByLabel("Ansprechperson Nachname").fill("Mustermann");
		await page
			.getByLabel("Ansprechperson E-Mail Adresse")
			.fill(`contact+${Date.now()}@example.com`);
		await page.getByLabel("Ansprechperson Telefonnummer").fill("+49 30 123456");

		await page
			.locator('form#institution-contact-form button[type="submit"]')
			.click();

		// Review + submit
		const submitButton = page.locator("#institution-draft-submit-button");
		await expect(submitButton).toBeVisible({ timeout: 15_000 });
		await expect(
			page
				.locator("#institution-title")
				.filter({ hasText: uniqueName })
				.first(),
		).toBeVisible();

		await submitButton.click();
		await waitForPostSubmitOutcome(page);
	});

	test("fills every single wizard field and submits for review", async ({
		page,
	}) => {
		const uniqueName = `E2E All Fields ${Date.now()}`;

		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();
		await fillById(page, "name", uniqueName);
		await fillById(page, "address.lat", "52.520008");
		await fillById(page, "address.lng", "13.404954");
		await fillById(page, "address.streetLine", "Alexanderplatz 1");
		await fillById(page, "address.address_suffix", "Aufgang B");
		await fillById(page, "address.zip", "10178");
		await fillById(page, "address.city", "Berlin");
		await fillById(page, "address.neighbourhood", "Mitte");
		await fillById(page, "address.cultural_area", "Zentrum");
		await selectFirstOptionById(page, "utilization_status");
		await fillById(page, "parent_organization", "Kulturverein Berlin");
		await fillById(page, "email", `all-fields-${Date.now()}@example.com`);
		await fillById(page, "phone", "+49 30 123456");
		await fillById(page, "website", "https://example.org/location");
		await page
			.locator('form#institution-basic-form button[type="submit"]')
			.click();

		await expect(page.getByText(/Schritt 2 \/ 5/)).toBeVisible();
		await fillById(page, "newCategory", `E2E Vollständig ${Date.now()}`);
		await page
			.locator('form#institution-category-form button[type="submit"]')
			.click();

		await expect(page.getByText(/Schritt 3 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await page.locator('[id="shared_use-yes"]').click();
		await openAllAccordions(page, "form#institution-shared-use-form");
		await fillById(
			page,
			"shared_use_info",
			"Raum ist grundsätzlich für Dritte nutzbar.",
		);
		await fillById(
			page,
			"shared_use_equipment",
			"Tische, Stühle, WLAN, Grundbeleuchtung",
		);
		await fillById(
			page,
			"shared_use_audience",
			"Geeignet für Proben, Lesungen, kleinere Veranstaltungen",
		);
		await fillById(page, "shared_use_availability", "Mo-Fr 10:00-18:00");
		await fillById(
			page,
			"shared_use_accessibility",
			"Erdgeschoss, barrierearm",
		);
		await fillById(page, "shared_use_cost", "80 EUR pro Stunde");
		await fillById(page, "shared_use_contact_person", "Kontakt: +49 30 222");
		await fillById(page, "legal_form", "e.V.");
		await selectFirstOptionById(page, "funding_type");
		const addFundingSource = page
			.locator("form#institution-shared-use-form button")
			.filter({ hasText: /hinzuf|add/i })
			.first();
		if ((await addFundingSource.count()) > 0) {
			await addFundingSource.click();
			await selectFirstOptionById(page, "funding_sources-0-source");
			await fillById(page, "funding_sources-0-description", "Landesmittel");
		}
		await fillById(page, "established_since", "2008-01-01");
		await fillById(page, "established_until", "2035-12-31");
		await fillById(page, "closing_reason", "Kein Schließungsgrund");
		await selectFirstOptionById(page, "owner_type");
		await fillById(page, "owner_name", "Eigentümer GmbH");
		await selectFirstOptionById(page, "rental_contract_type");
		await fillById(page, "rental_contract_end", "2030-12-31");
		await selectFirstOptionById(page, "protection_status");
		await fillById(
			page,
			"protection_status_info",
			"Status laut letzter Abstimmung",
		);
		await fillById(
			page,
			"protection_status_internal_notes",
			"Interne Hinweise zur Sicherung",
		);
		await fillById(page, "area", "450");
		await fillById(page, "number_of_rooms", "8");
		await fillById(page, "capacity", "280");
		await fillById(page, "accessibility", "Aufzug vorhanden");
		await fillById(page, "cost", "Miete abhängig von Nutzungsdauer");
		await fillById(page, "notes", "Zusätzliche Hinweise für Review");
		await page
			.locator('form#institution-shared-use-form button[type="submit"]')
			.click();

		await expect(page.getByText(/Schritt 4 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await checkById(page, "works_for_organization");
		await checkById(page, "consent_contact_listing");
		await fillById(page, "contact_person_first_name", "Max");
		await fillById(page, "contact_person_last_name", "Mustermann");
		await fillById(
			page,
			"contact_person_email",
			`contact-all-${Date.now()}@example.com`,
		);
		await fillById(page, "contact_person_phone", "+49 30 654321");
		await page
			.locator('form#institution-contact-form button[type="submit"]')
			.click();

		const submitButton = page.locator("#institution-draft-submit-button");
		await expect(submitButton).toBeVisible({ timeout: 15_000 });
		await submitButton.click();
		await waitForPostSubmitOutcome(page);
	});
});
