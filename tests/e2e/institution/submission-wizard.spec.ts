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
			/\/de\/(?:account(?:\/institutions|\/activity)?|map|login|welcome)(?:\/)?$/;
		const submitButton = page.getByRole("button", { name: "Submission senden" });
		const stepOneIndicator = page.getByText(/Schritt 1 \/ 5/);

		await Promise.race([
			expect(page).toHaveURL(postSubmitRoutePattern, { timeout: 45_000 }),
			(async () => {
				await expect(submitButton).toBeHidden({ timeout: 45_000 });
				await expect(stepOneIndicator).toBeVisible({ timeout: 45_000 });
			})(),
		]);
	};

	test("blocks forward stepper jumps when required fields are missing", async ({
		page,
	}) => {
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();

		await page.getByRole("button", { name: "Go to step 2" }).click();
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();

		// Even with valid current step, jumping multiple steps ahead is blocked.
		await page
			.getByLabel("Name des Kulturortes")
			.fill("E2E Validation Institution");
		await page.getByRole("button", { name: "Go to step 5" }).click();
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();

		await page.getByRole("button", { name: "Go to step 2" }).click();
		await expect(page.getByText(/Schritt 2 \/ 5/)).toBeVisible();
	});

	test("supports lng/lat-only draft and can submit for review", async ({
		page,
	}) => {
		const uniqueName = `E2E LatLng ${Date.now()}`;

		await page.getByLabel("Name des Kulturortes").fill(uniqueName);
		await page.getByLabel("Breitengrad").fill("52.520008");
		await page.getByLabel("Längengrad").fill("13.404954");

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
		await expect(
			page.getByRole("button", { name: "Submission senden" }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page
				.locator("#institution-title")
				.filter({ hasText: uniqueName })
				.first(),
		).toBeVisible();

		await page.getByRole("button", { name: "Submission senden" }).click();
		await waitForPostSubmitOutcome(page);
	});

	test("fills a detailed multi-step draft and submits it for review", async ({
		page,
	}) => {
		const uniqueName = `E2E Full Draft ${Date.now()}`;

		// Step 1: basic details
		await expect(page.getByText(/Schritt 1 \/ 5/)).toBeVisible();
		await page.getByLabel("Name des Kulturortes").fill(uniqueName);
		await page.getByLabel("Breitengrad").fill("52.520008");
		await page.getByLabel("Längengrad").fill("13.404954");
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
		await page
			.getByRole("checkbox", {
				name: "Ich arbeite für diese Kulturorganisation.",
			})
			.click();
		await page
			.getByRole("checkbox", {
				name: /Ich bin damit einverstanden/i,
			})
			.click();
		await page.getByLabel("Kontaktperson Vorname").fill("Max");
		await page.getByLabel("Kontaktperson Nachname").fill("Mustermann");
		await page
			.getByLabel("Kontaktperson E-Mail")
			.fill(`contact+${Date.now()}@example.com`);
		await page.getByLabel("Kontaktperson Telefon").fill("+49 30 123456");

		await page
			.locator('form#institution-contact-form button[type="submit"]')
			.click();

		// Review + submit
		await expect(
			page.getByRole("button", { name: "Submission senden" }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page
				.locator("#institution-title")
				.filter({ hasText: uniqueName })
				.first(),
		).toBeVisible();

		await page.getByRole("button", { name: "Submission senden" }).click();
		await waitForPostSubmitOutcome(page);
	});
});
