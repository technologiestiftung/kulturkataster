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

	const serializeOptionValue = (value: string | number | boolean) =>
		typeof value === "string" ? value : `${typeof value}:${String(value)}`;

	const getVisibleFieldById = async (
		page: import("@playwright/test").Page,
		id: string,
	) => {
		const field = page.locator(`[id="${id}"]`).first();
		await expect(field, `Expected wizard field "${id}" to exist.`).toHaveCount(
			1,
			{ timeout: 15_000 },
		);
		await expect(
			field,
			`Expected wizard field "${id}" to be visible.`,
		).toBeVisible({ timeout: 15_000 });
		return field;
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

	const fillRequiredById = async (
		page: import("@playwright/test").Page,
		id: string,
		value: string,
	) => {
		const field = await getVisibleFieldById(page, id);
		await field.fill(value);
		await expect(field).toHaveValue(value);
	};

	const selectOptionById = async (
		page: import("@playwright/test").Page,
		id: string,
		optionName: string,
	) => {
		const trigger = await getVisibleFieldById(page, id);
		await trigger.click();

		const listboxId = await trigger.getAttribute("aria-controls");
		expect(
			listboxId,
			`Select "${id}" should expose aria-controls when opened.`,
		).toBeTruthy();

		const listbox = page.locator(`#${listboxId}`);
		const option = listbox.getByRole("option", {
			name: optionName,
			exact: true,
		});
		await expect(
			option,
			`Expected select "${id}" to show option "${optionName}".`,
		).toBeVisible({ timeout: 15_000 });
		await option.press("Enter");
		await expect(trigger).toContainText(optionName);
	};

	const chooseRadioValue = async (
		page: import("@playwright/test").Page,
		fieldName: string,
		value: string | number | boolean,
	) => {
		const radio = await getVisibleFieldById(
			page,
			`${fieldName}-${serializeOptionValue(value)}`,
		);
		await radio.click();
		await expect(radio).toHaveAttribute("data-state", "checked");
	};

	const expectReviewFieldValue = async (
		page: import("@playwright/test").Page,
		label: string,
		value: string,
	) => {
		const row = page
			.locator("div")
			.filter({
				has: page.locator("strong", { hasText: label }),
			})
			.first();
		await expect(row).toContainText(value);
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
		const timestamp = Date.now();
		const uniqueName = `E2E All Fields ${timestamp}`;
		let fundingTypeLabel = "";
		let fundingSourceLabel = "";
		let ownerTypeLabel = "";
		let rentalContractTypeLabel = "";
		let protectionStatusLabel = "";

		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();
		await fillRequiredById(page, "name", uniqueName);
		await fillRequiredById(page, "address.lat", "52.520008");
		await fillRequiredById(page, "address.lng", "13.404954");
		await fillRequiredById(page, "address.streetLine", "Alexanderplatz 1");
		await fillRequiredById(page, "address.address_suffix", "Aufgang B");
		await fillRequiredById(page, "address.zip", "10178");
		await fillRequiredById(page, "address.city", "Berlin");
		await fillRequiredById(page, "address.neighbourhood", "Mitte");
		await fillRequiredById(page, "address.district", "Berlin-Mitte");
		await fillRequiredById(page, "address.cultural_area", "Zentrum");
		await selectOptionById(page, "utilization_status", "In Nutzung");
		await fillRequiredById(page, "parent_organization", "Kulturverein Berlin");
		await fillRequiredById(
			page,
			"email",
			`all-fields-${timestamp}@example.com`,
		);
		await fillRequiredById(page, "phone", "+49 30 123456");
		await fillRequiredById(page, "website", "https://example.org/location");
		await page
			.locator('form#institution-basic-form button[type="submit"]')
			.click();

		await expect(page.getByText(/Schritt 2 \/ 5/)).toBeVisible();
		await fillRequiredById(page, "newCategory", `E2E Vollständig ${timestamp}`);
		await page
			.locator('form#institution-category-form button[type="submit"]')
			.click();

		await expect(page.getByText(/Schritt 3 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await chooseRadioValue(page, "shared_use_allowed", true);
		await openAllAccordions(page, "form#institution-shared-use-form");
		await fillRequiredById(
			page,
			"shared_use_info",
			"Raum ist grundsätzlich für Dritte nutzbar.",
		);
		await fillRequiredById(
			page,
			"shared_use_equipment",
			"Tische, Stühle, WLAN, Grundbeleuchtung",
		);
		await fillRequiredById(
			page,
			"shared_use_audience",
			"Geeignet für Proben, Lesungen, kleinere Veranstaltungen",
		);
		await fillRequiredById(
			page,
			"shared_use_availability",
			"Mo-Fr 10:00-18:00",
		);
		await fillRequiredById(page, "accessibility", "Erdgeschoss, barrierearm");
		await fillRequiredById(page, "cost", "80 EUR pro Stunde");
		await fillRequiredById(
			page,
			"shared_use_contact_person",
			"Kontakt: +49 30 222",
		);
		await fillRequiredById(page, "legal_form", "e.V.");
		fundingTypeLabel = "Arbeitsraumprogramm";
		await selectOptionById(page, "funding_type", fundingTypeLabel);
		const addFundingSource = page
			.locator("form#institution-shared-use-form button")
			.filter({ hasText: /hinzuf|add/i })
			.first();
		if ((await addFundingSource.count()) > 0) {
			await addFundingSource.click();
			fundingSourceLabel = "Kirche";
			await selectOptionById(
				page,
				"funding_sources-0-source",
				fundingSourceLabel,
			);
			await fillRequiredById(
				page,
				"funding_sources-0-description",
				"Landesmittel",
			);
		}
		await fillRequiredById(page, "established_since", "2008-01-01");
		await fillRequiredById(page, "established_until", "2035-12-31");
		await fillRequiredById(page, "closing_reason", "Kein Schließungsgrund");
		ownerTypeLabel = "Privat";
		await selectOptionById(page, "owner_type", ownerTypeLabel);
		await fillRequiredById(page, "owner_name", "Eigentümer GmbH");
		rentalContractTypeLabel = "Befristeter Mietvertrag";
		await selectOptionById(
			page,
			"rental_contract_type",
			rentalContractTypeLabel,
		);
		await fillRequiredById(page, "rental_contract_end", "2030-12-31");
		protectionStatusLabel = "Langfristig gesichert";
		await selectOptionById(page, "protection_status", protectionStatusLabel);
		await fillRequiredById(
			page,
			"protection_status_info",
			"Status laut letzter Abstimmung",
		);
		await fillRequiredById(
			page,
			"protection_status_internal_notes",
			"Interne Hinweise zur Sicherung",
		);
		await fillRequiredById(page, "area", "451");
		await fillRequiredById(page, "number_of_rooms", "17");
		await fillRequiredById(page, "capacity", "283");
		await fillRequiredById(page, "source", "Eigene Recherche vor Ort");
		await fillRequiredById(page, "notes", "Zusätzliche Hinweise für Review");
		await fillRequiredById(
			page,
			"internal_notes",
			"Interne Notiz für die Prüfung dieses Entwurfs",
		);
		await page
			.locator('form#institution-shared-use-form button[type="submit"]')
			.click();

		await expect(page.getByText(/Schritt 4 \/ 5/)).toBeVisible({
			timeout: 15_000,
		});
		await chooseRadioValue(page, "works_for_organization", true);
		await chooseRadioValue(page, "consent_contact_listing", true);
		await fillRequiredById(page, "contact_person_first_name", "Max");
		await fillRequiredById(page, "contact_person_last_name", "Mustermann");
		await fillRequiredById(
			page,
			"contact_person_email",
			`contact-all-${timestamp}@example.com`,
		);
		await fillRequiredById(page, "contact_person_phone", "+49 30 654321");
		await page
			.locator('form#institution-contact-form button[type="submit"]')
			.click();

		const submitButton = page.locator("#institution-draft-submit-button");
		await expect(submitButton).toBeVisible({ timeout: 15_000 });
		await expectReviewFieldValue(page, "Art der Förderung:", fundingTypeLabel);
		if (fundingSourceLabel) {
			await expectReviewFieldValue(
				page,
				"Art der Finanzierung:",
				`${fundingSourceLabel}: Landesmittel`,
			);
		}
		await expectReviewFieldValue(page, "Eigentümer*innenart:", ownerTypeLabel);
		await expectReviewFieldValue(
			page,
			"Vertragsform:",
			rentalContractTypeLabel,
		);
		await expectReviewFieldValue(
			page,
			"Sicherungsstatus:",
			protectionStatusLabel,
		);
		await expectReviewFieldValue(page, "Ansprechperson Vorname:", "Max");
		await expectReviewFieldValue(
			page,
			"Ansprechperson Nachname:",
			"Mustermann",
		);
		await expectReviewFieldValue(
			page,
			"Ansprechperson E-Mail Adresse:",
			`contact-all-${timestamp}@example.com`,
		);
		await expectReviewFieldValue(
			page,
			"Ansprechperson Telefonnummer:",
			"+49 30 654321",
		);
		await expectReviewFieldValue(
			page,
			"Barrierefreiheit:",
			"Erdgeschoss, barrierearm",
		);
		await expectReviewFieldValue(page, "Kosten:", "80 EUR pro Stunde");
		await expectReviewFieldValue(page, "Nutzfläche (m²):", "451");
		await expectReviewFieldValue(page, "Anzahl der Arbeitsräume:", "17");
		await expectReviewFieldValue(page, "Kapazität:", "283");
		await submitButton.click();
		await waitForPostSubmitOutcome(page);
	});
});
