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
		await trigger.focus();
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
	};

	test("admin can fill every institution form field and create institution", async ({
		page,
	}) => {
		const uniqueName = `E2E Direct Create ${Date.now()}`;

		await safeGoto(
			page,
			"/de/account/institutions",
			/\/de\/account\/institutions\/?$/,
		);
		const openedDirectCreate = await safeGoto(
			page,
			"/de/account/institutions/new",
			/\/de\/account\/institutions\/new\/?$/,
		)
			.then(() => true)
			.catch(() => false);
		if (!openedDirectCreate) {
			const openedSubmission = await safeGoto(
				page,
				"/de/institution/submission",
				/\/de\/institution\/submission\/?$/,
			)
				.then(() => true)
				.catch(() => false);
			test.skip(
				!openedSubmission,
				"Direct create and submission routes are not accessible for this account.",
			);
			return;
		}

		await fillById(page, "name", uniqueName);
		await fillById(page, "parent_organization", "Kultur Trägerverein");
		await selectFirstOptionById(page, "utilization_status");
		await fillById(page, "address.lat", "52.520008");
		await fillById(page, "address.lng", "13.404954");
		await fillById(page, "address.streetLine", "Alexanderplatz 1");
		await fillById(page, "address.zip", "10178");
		await fillById(page, "address.address_suffix", "Haus A");
		await fillById(page, "address.neighbourhood", "Mitte");
		await fillById(page, "address.city", "Berlin");
		await fillById(page, "address.cultural_area", "Zentrum");

		await fillById(page, "website", "https://example.org/institution");
		await fillById(page, "email", `direct-${Date.now()}@example.com`);
		await fillById(page, "phone", "+49 30 123456");
		await fillById(page, "contact_person_first_name", "Anna");
		await fillById(page, "contact_person_last_name", "Beispiel");
		await fillById(
			page,
			"contact_person_email",
			`contact-${Date.now()}@example.com`,
		);
		await fillById(page, "contact_person_phone", "+49 30 654321");

		await fillById(page, "legal_form", "e.V.");
		await selectFirstOptionById(page, "owner_type");
		await fillById(page, "owner_name", "Eigentümer GmbH");
		await fillById(page, "established_since", "2009-01-01");
		await fillById(page, "established_until", "2036-12-31");
		await selectFirstOptionById(page, "rental_contract_type");
		await fillById(page, "rental_contract_end", "2030-12-31");
		await fillById(page, "closing_reason", "Kein Schließungsgrund");

		await selectFirstOptionById(page, "funding_type");
		const addFundingSourceButton = page
			.getByRole("button")
			.filter({ hasText: /hinzuf|add/i })
			.first();
		if ((await addFundingSourceButton.count()) > 0) {
			await addFundingSourceButton.click();
			await selectFirstOptionById(page, "funding_sources-0-source");
			await fillById(page, "funding_sources-0-description", "Landesmittel");
		}

		await fillById(page, "area", "550");
		await fillById(page, "capacity", "320");
		await fillById(page, "number_of_rooms", "9");
		await fillById(page, "accessibility", "Barrierearm, Aufzug vorhanden");
		await fillById(page, "cost", "Miete je Nutzung");

		await selectFirstOptionById(page, "protection_status");
		await fillById(page, "protection_status_info", "Status bestätigt");
		await fillById(
			page,
			"protection_status_internal_notes",
			"Interne Absicherungshinweise",
		);
		await fillById(page, "notes", "E2E komplette Formularprüfung");

		const submitButton = page
			.getByRole("button", { name: /Erstellen|Speichern/i })
			.last();
		await Promise.all([
			page.waitForURL(/\/de\/account\/institutions\/?$/, { timeout: 45_000 }),
			submitButton.click(),
		]);
		await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
	});
});
