/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionnaireInstitutionCreateForm } from "@/components/Questionnaire/QuestionnaireInstitutionCreateForm";
import { createSubmission } from "@/server/actions/submissions";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			(options?.defaultValue as string) ?? key,
	}),
}));

vi.mock("@/server/actions/submissions", () => ({
	createSubmission: vi.fn(),
}));

vi.mock("@/server/actions/maptiler", () => ({
	geocodeAddress: vi.fn(),
	reverseGeocode: vi.fn(),
}));

let lastFormConfig: {
	fields?: Array<Record<string, unknown>>;
	onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
	submitDisabled?: boolean;
} | null = null;

vi.mock("@/components/FormWrapper", () => ({
	FormWrapper: ({ config }: { config: any }) => {
		lastFormConfig = config;
		return (
			<button onClick={() => config.onSubmit?.(lastSubmitData)}>
				mock-form-submit
			</button>
		);
	},
}));

let lastSubmitData: Record<string, unknown> = {};

const getFieldNames = (index: number): string[] | undefined =>
	(
		lastFormConfig?.fields?.[index] as { fields?: Array<{ name: string }> }
	).fields?.map((field) => field.name);

describe("QuestionnaireInstitutionCreateForm", () => {
	beforeEach(() => {
		lastFormConfig = null;
		lastSubmitData = {};
		vi.mocked(createSubmission).mockReset();
	});

	it("creates an institution submission with questionnaire institution details and full address", async () => {
		vi.mocked(createSubmission).mockResolvedValue({ id: 42 } as any);
		const onCreated = vi.fn();

		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				onCreated={onCreated}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		lastSubmitData = {
			name: "Test Kulturort",
			categoryFilters: { category_keys: ["museums"] },
			established_since: "2015-01-01",
			"address.lat": "52.5",
			"address.lng": "13.4",
			"address.streetLine": "Musterstraße 1",
			"address.address_suffix": "Hinterhof",
			"address.zip": "12345",
			"address.city": "Berlin",
			"address.neighbourhood": "Kreuzberg",
			"address.district": "Friedrichshain-Kreuzberg",
			"address.cultural_area": "Wrangelkiez",
		};
		screen.getByText("mock-form-submit").click();
		await Promise.resolve();
		await Promise.resolve();

		expect(createSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "institution",
				entityId: null,
				type: "create",
				data: expect.objectContaining({
					name: "Test Kulturort",
					established_since: "2015-01-01",
					address: expect.objectContaining({
						lat: 52.5,
						lng: 13.4,
						address_suffix: "Hinterhof",
						zipcode: "12345",
						city: "Berlin",
						neighbourhood: "Kreuzberg",
						district: "Friedrichshain-Kreuzberg",
						cultural_area: "Wrangelkiez",
					}),
				}),
			}),
		);
		expect(onCreated).toHaveBeenCalledWith(42);
	});

	it("creates a separate category submission for each suggested new category", async () => {
		vi.mocked(createSubmission).mockResolvedValue({ id: 7 } as any);

		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				onCreated={vi.fn()}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		lastSubmitData = {
			name: "Test Kulturort",
			newCategory: "Archiv, Werkstatt",
		};
		screen.getByText("mock-form-submit").click();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect(createSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "category",
				data: { key: "Archiv" },
				meta: expect.objectContaining({ institutionSubmissionId: 7 }),
			}),
		);
		expect(createSubmission).toHaveBeenCalledWith(
			expect.objectContaining({
				entityType: "category",
				data: { key: "Werkstatt" },
			}),
		);
	});

	it("renders the new-institution questionnaire and full address fields", () => {
		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				onCreated={vi.fn()}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		expect(lastFormConfig?.fields?.map((field) => field.name)).toEqual([
			"basicSection",
			"categorySection",
			"newCategorySection",
		]);
		expect(getFieldNames(1)?.[0]).toBe("categoryFilters");
		expect(getFieldNames(2)?.[0]).toBe("newCategory");
		expect(getFieldNames(0)).toEqual([
			"name",
			"address.map",
			"address.lng",
			"address.lat",
			"address.streetLine",
			"address.address_suffix",
			"address.zip",
			"address.city",
			"address.neighbourhood",
			"address.district",
			"address.cultural_area",
			"established_since",
		]);
	});

	it("disables the submit button while submitting", () => {
		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				onCreated={vi.fn()}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		expect(lastFormConfig?.submitDisabled).toBe(false);
	});
});
