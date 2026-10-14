import { test, expect } from "@playwright/test";
import { safeGoto } from "../../helpers/e2eNavigation";
import { prepareStableUi } from "../../helpers/e2eStableUi";
import { ADMIN_STORAGE_STATE } from "../../helpers/e2eAuthState";

const hasRealAdminCredentials =
	!!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

test.describe("institution direct create form", () => {
	test.setTimeout(90_000);
	test.use({ storageState: ADMIN_STORAGE_STATE });

	test.beforeEach(async ({ page }) => {
		test.skip(!hasRealAdminCredentials, "E2E admin credentials not set");
		await prepareStableUi(page);
		await safeGoto(page, "/de/account", /\/de\/account(?:\/activity)?\/?$/);
	});

	const serializeOptionValue = (value: string | number | boolean) =>
		typeof value === "string" ? value : `${typeof value}:${String(value)}`;

	const getVisibleFieldById = async (
		page: import("@playwright/test").Page,
		id: string,
	) => {
		const field = page.locator(`[id="${id}"]`).first();
		await expect(field, `Expected field "${id}" to exist.`).toHaveCount(1, {
			timeout: 15_000,
		});
		await expect(field, `Expected field "${id}" to be visible.`).toBeVisible({
			timeout: 15_000,
		});
		return field;
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
		optionName: string | string[],
	) => {
		const trigger = await getVisibleFieldById(page, id);
		await trigger.click();

		const listboxId = await trigger.getAttribute("aria-controls");
		expect(
			listboxId,
			`Select "${id}" should expose aria-controls when opened.`,
		).toBeTruthy();

		const listbox = page.locator(`[id="${listboxId}"]`);
		await expect(listbox).toBeVisible({ timeout: 15_000 });
		const visibleOptionNames = (
			await listbox.getByRole("option").allTextContents()
		)
			.map((text) => text.trim())
			.filter(Boolean);
		const optionNames = Array.isArray(optionName) ? optionName : [optionName];
		const selectedOptionName = optionNames.find((name) =>
			visibleOptionNames.includes(name),
		);

		expect(
			selectedOptionName,
			`Expected select "${id}" to show one of: ${optionNames.join(", ")}. Visible options: ${visibleOptionNames.join(", ")}`,
		).toBeTruthy();

		const option = listbox.getByRole("option", {
			name: selectedOptionName!,
			exact: true,
		});
		await expect(
			option,
			`Expected select "${id}" to show option "${selectedOptionName}".`,
		).toBeVisible({ timeout: 15_000 });
		await option.press("Enter");
		await expect(trigger).toContainText(selectedOptionName!);
	};

	const chooseRadioValue = async (
		page: import("@playwright/test").Page,
		fieldName: string,
		value: string | number | boolean,
	) => {
		const optionId = `${fieldName}-${serializeOptionValue(value)}`;
		const radio = await getVisibleFieldById(page, optionId);
		await radio.scrollIntoViewIfNeeded();
		await page.locator(`label[for="${optionId}"]`).click();
		if ((await radio.getAttribute("data-state")) !== "checked") {
			await radio.focus();
			await page.keyboard.press("Space");
		}
		await expect(radio).toHaveAttribute("data-state", "checked");
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

	const selectFirstVisibleCategory = async (
		page: import("@playwright/test").Page,
		formSelector: string,
	) => {
		const checkbox = page.locator(`${formSelector} [role="checkbox"]`).first();
		const count = await checkbox.count();
		if (count === 0) return null;
		await expect(checkbox).toBeVisible({ timeout: 15_000 });
		const label = await checkbox.getAttribute("aria-label");
		await checkbox.click();
		await expect(checkbox).toHaveAttribute("data-state", "checked");
		return label;
	};

	const expectInputValueById = async (
		page: import("@playwright/test").Page,
		id: string,
		value: string,
	) => {
		const field = await getVisibleFieldById(page, id);
		await expect(field).toHaveValue(value);
	};

	const expectInputValueMatchingById = async (
		page: import("@playwright/test").Page,
		id: string,
		pattern: RegExp,
	) => {
		const field = await getVisibleFieldById(page, id);
		await expect(field).toHaveValue(pattern);
	};

	const expectNumericValueNearById = async (
		page: import("@playwright/test").Page,
		id: string,
		expected: number,
		tolerance = 0.01,
	) => {
		const field = await getVisibleFieldById(page, id);
		const actual = Number(await field.inputValue());
		expect(actual).toBeGreaterThan(expected - tolerance);
		expect(actual).toBeLessThan(expected + tolerance);
	};

	const expectSelectedOptionById = async (
		page: import("@playwright/test").Page,
		id: string,
		value: string | string[],
	) => {
		const trigger = await getVisibleFieldById(page, id);
		const values = Array.isArray(value) ? value : [value];
		await expect(trigger).toContainText(new RegExp(values.join("|")));
	};

	test("admin can fill every institution form field, create it, and reopen it with all values intact", async ({
		page,
	}) => {
		const timestamp = Date.now();
		const uniqueName = `E2E Direct Create ${timestamp}`;
		const expected = {
			parentOrganization: "Kultur Trägerverein",
			website: "https://example.org/institution",
			email: `direct-${timestamp}@example.com`,
			phone: "+49 30 000000",
			contactFirstName: "Anna",
			contactLastName: "Beispiel",
			contactEmail: `contact-${timestamp}@example.com`,
			contactPhone: "+49 30 654321",
			utilizationStatus: "In Nutzung",
			sharedUseInfo: "Raum ist grundsätzlich für Dritte nutzbar.",
			sharedUseEquipment: "Tische, Stühle, WLAN, Grundbeleuchtung",
			sharedUseAudience:
				"Geeignet für Proben, Lesungen, kleinere Veranstaltungen",
			sharedUseAvailability: "Mo-Fr 10:00-18:00",
			sharedUseContactPerson: "Kontakt: +49 30 222",
			accessibility: "Erdgeschoss, barrierearm",
			cost: "80 EUR pro Stunde",
			legalForm: "e.V.",
			fundingType: "Arbeitsraumprogramm",
			fundingSource: "Kirche",
			fundingSourceDescription: "Landesmittel",
			establishedSince: "2008",
			establishedUntil: "2035",
			closingReason: "Kein Schließungsgrund",
			ownerType: "Privat",
			ownerName: "Eigentümer GmbH",
			rentalContractType: "Befristeter Mietvertrag",
			rentalContractEnd: "2030-12-31",
			protectionStatus: "Langfristig gesichert",
			protectionStatusInfo: "Status bestätigt",
			protectionStatusInternalNotes: "Interne Absicherungshinweise",
			area: "451",
			numberOfRooms: "17",
			capacity: "283",
			source: "Eigene Recherche vor Ort",
			notes: "E2E komplette Formularprüfung",
			internalNotes: "Interne Notiz für den Direktanlage-Test",
			streetLine: "Alexanderplatz",
			addressSuffix: "Haus A",
			zip: "10178",
			city: "Berlin",
			district: "Berlin-Mitte",
			neighbourhood: "Mitte",
			culturalArea: "Zentrum",
			lat: "52.520008",
			lng: "13.404954",
		};

		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/account\/institutions\/?$/,
		);
		await safeGoto(
			page,
			"/de/account/institutions/new",
			/\/de\/account\/institutions\/new\/?$/,
		);

		const selectedCategoryLabel = await selectFirstVisibleCategory(
			page,
			"form",
		);

		await fillRequiredById(page, "name", uniqueName);
		await fillRequiredById(
			page,
			"parent_organization",
			expected.parentOrganization,
		);
		await selectOptionById(
			page,
			"utilization_status",
			expected.utilizationStatus,
		);
		await fillRequiredById(page, "address.lat", expected.lat);
		await fillRequiredById(page, "address.lng", expected.lng);
		await fillRequiredById(page, "address.streetLine", expected.streetLine);
		await fillRequiredById(page, "address.zip", expected.zip);
		await fillRequiredById(
			page,
			"address.address_suffix",
			expected.addressSuffix,
		);
		await fillRequiredById(
			page,
			"address.neighbourhood",
			expected.neighbourhood,
		);
		await fillRequiredById(page, "address.city", expected.city);
		await fillRequiredById(page, "address.district", expected.district);
		await fillRequiredById(
			page,
			"address.cultural_area",
			expected.culturalArea,
		);

		await fillRequiredById(page, "website", expected.website);
		await fillRequiredById(page, "email", expected.email);
		await fillRequiredById(page, "phone", expected.phone);
		await fillRequiredById(
			page,
			"contact_person_first_name",
			expected.contactFirstName,
		);
		await fillRequiredById(
			page,
			"contact_person_last_name",
			expected.contactLastName,
		);
		await fillRequiredById(page, "contact_person_email", expected.contactEmail);
		await fillRequiredById(page, "contact_person_phone", expected.contactPhone);

		await chooseRadioValue(page, "shared_use_allowed", true);
		await openAllAccordions(page, "form");
		await fillRequiredById(page, "shared_use_info", expected.sharedUseInfo);
		await fillRequiredById(
			page,
			"shared_use_equipment",
			expected.sharedUseEquipment,
		);
		await fillRequiredById(
			page,
			"shared_use_audience",
			expected.sharedUseAudience,
		);
		await fillRequiredById(
			page,
			"shared_use_availability",
			expected.sharedUseAvailability,
		);
		await fillRequiredById(
			page,
			"shared_use_contact_person",
			expected.sharedUseContactPerson,
		);
		await fillRequiredById(page, "accessibility", expected.accessibility);
		await fillRequiredById(page, "cost", expected.cost);

		await fillRequiredById(page, "legal_form", expected.legalForm);
		await selectOptionById(page, "funding_type", expected.fundingType);
		const addFundingSourceButton = page
			.getByRole("button")
			.filter({ hasText: /hinzuf|add/i })
			.first();
		if ((await addFundingSourceButton.count()) > 0) {
			await addFundingSourceButton.click();
			await selectOptionById(
				page,
				"funding_sources-0-source",
				expected.fundingSource,
			);
			await fillRequiredById(
				page,
				"funding_sources-0-description",
				expected.fundingSourceDescription,
			);
		}
		await fillRequiredById(
			page,
			"established_since",
			expected.establishedSince,
		);
		await fillRequiredById(
			page,
			"established_until",
			expected.establishedUntil,
		);
		await fillRequiredById(page, "closing_reason", expected.closingReason);
		await selectOptionById(page, "owner_type", expected.ownerType);
		await fillRequiredById(page, "owner_name", expected.ownerName);
		await selectOptionById(page, "rental_contract_type", [
			expected.rentalContractType,
			"Befristete Miete",
		]);
		await fillRequiredById(
			page,
			"rental_contract_end",
			expected.rentalContractEnd,
		);
		await selectOptionById(
			page,
			"protection_status",
			expected.protectionStatus,
		);
		await fillRequiredById(
			page,
			"protection_status_info",
			expected.protectionStatusInfo,
		);
		await fillRequiredById(
			page,
			"protection_status_internal_notes",
			expected.protectionStatusInternalNotes,
		);
		await fillRequiredById(page, "area", expected.area);
		await fillRequiredById(page, "capacity", expected.capacity);
		await fillRequiredById(page, "number_of_rooms", expected.numberOfRooms);
		await fillRequiredById(page, "source", expected.source);
		await fillRequiredById(page, "notes", expected.notes);
		await fillRequiredById(page, "internal_notes", expected.internalNotes);

		const submitButton = page
			.getByRole("button", { name: /Erstellen|Speichern/i })
			.last();
		await Promise.all([
			page.waitForURL(/\/de\/account\/institutions\/?$/, {
				timeout: 45_000,
				waitUntil: "commit",
			}),
			submitButton.click(),
		]);
		await expect(
			page.getByRole("dialog", { name: /Kulturort erstellen/i }),
		).toBeHidden({ timeout: 15_000 });
		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
		await page.reload();
		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
		await page
			.getByRole("textbox", { name: /Kulturorte suchen/i })
			.fill(uniqueName);

		const createdRow = page
			.getByRole("row")
			.filter({ hasText: uniqueName })
			.first();
		await expect(createdRow).toBeVisible({ timeout: 15_000 });
		await createdRow
			.getByRole("button", { name: "Bearbeiten", exact: true })
			.click();
		await expect(page).toHaveURL(/\/de\/account\/institutions\/\d+\/edit\/?$/, {
			timeout: 45_000,
		});
		await openAllAccordions(page, "form");

		if (selectedCategoryLabel) {
			await expect(
				page.locator(
					`form [role="checkbox"][aria-label="${selectedCategoryLabel}"]`,
				),
			).toHaveAttribute("data-state", "checked");
		}
		await expectInputValueById(page, "name", uniqueName);
		await expectInputValueById(
			page,
			"parent_organization",
			expected.parentOrganization,
		);
		await expectSelectedOptionById(
			page,
			"utilization_status",
			expected.utilizationStatus,
		);
		await expectNumericValueNearById(page, "address.lat", Number(expected.lat));
		await expectNumericValueNearById(page, "address.lng", Number(expected.lng));
		await expectInputValueById(page, "address.streetLine", expected.streetLine);
		await expectInputValueById(page, "address.zip", expected.zip);
		await expectInputValueById(
			page,
			"address.address_suffix",
			expected.addressSuffix,
		);
		await expectInputValueById(
			page,
			"address.neighbourhood",
			expected.neighbourhood,
		);
		await expectInputValueById(page, "address.city", expected.city);
		await expectInputValueMatchingById(
			page,
			"address.district",
			/(Berlin-)?Mitte/,
		);
		await expectInputValueById(
			page,
			"address.cultural_area",
			expected.culturalArea,
		);
		await expectInputValueById(page, "website", expected.website);
		await expectInputValueById(page, "email", expected.email);
		await expectInputValueById(page, "phone", expected.phone);
		await expectInputValueById(
			page,
			"contact_person_first_name",
			expected.contactFirstName,
		);
		await expectInputValueById(
			page,
			"contact_person_last_name",
			expected.contactLastName,
		);
		await expectInputValueById(
			page,
			"contact_person_email",
			expected.contactEmail,
		);
		await expectInputValueById(
			page,
			"contact_person_phone",
			expected.contactPhone,
		);
		await expect(
			page.locator('[id="shared_use_allowed-boolean:true"]'),
		).toHaveAttribute("data-state", "checked");
		await openAllAccordions(page, "form");
		await expectInputValueById(page, "shared_use_info", expected.sharedUseInfo);
		await expectInputValueById(
			page,
			"shared_use_equipment",
			expected.sharedUseEquipment,
		);
		await expectInputValueById(
			page,
			"shared_use_audience",
			expected.sharedUseAudience,
		);
		await expectInputValueById(
			page,
			"shared_use_availability",
			expected.sharedUseAvailability,
		);
		await expectInputValueById(
			page,
			"shared_use_contact_person",
			expected.sharedUseContactPerson,
		);
		await expectInputValueById(page, "accessibility", expected.accessibility);
		await expectInputValueById(page, "cost", expected.cost);
		await expectInputValueById(page, "legal_form", expected.legalForm);
		await expectSelectedOptionById(page, "funding_type", expected.fundingType);
		await expectSelectedOptionById(
			page,
			"funding_sources-0-source",
			expected.fundingSource,
		);
		await expectInputValueById(
			page,
			"funding_sources-0-description",
			expected.fundingSourceDescription,
		);
		await expectInputValueById(
			page,
			"established_since",
			expected.establishedSince,
		);
		await expectInputValueById(
			page,
			"established_until",
			expected.establishedUntil,
		);
		await expectInputValueById(page, "closing_reason", expected.closingReason);
		await expectSelectedOptionById(page, "owner_type", expected.ownerType);
		await expectInputValueById(page, "owner_name", expected.ownerName);
		await expectSelectedOptionById(page, "rental_contract_type", [
			expected.rentalContractType,
			"Befristete Miete",
		]);
		await expectInputValueById(
			page,
			"rental_contract_end",
			expected.rentalContractEnd,
		);
		await expectSelectedOptionById(
			page,
			"protection_status",
			expected.protectionStatus,
		);
		await expectInputValueById(
			page,
			"protection_status_info",
			expected.protectionStatusInfo,
		);
		await expectInputValueById(
			page,
			"protection_status_internal_notes",
			expected.protectionStatusInternalNotes,
		);
		await expectInputValueById(page, "area", expected.area);
		await expectInputValueById(page, "number_of_rooms", expected.numberOfRooms);
		await expectInputValueById(page, "capacity", expected.capacity);
		await expectInputValueById(page, "source", expected.source);
		await expectInputValueById(page, "notes", expected.notes);
		await expectInputValueById(page, "internal_notes", expected.internalNotes);
	});
});
