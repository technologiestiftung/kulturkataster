/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionnaireInstitutionCreateForm } from "@/components/Questionnaire/QuestionnaireInstitutionCreateForm";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			(options?.defaultValue as string) ?? key,
	}),
}));

vi.mock("@/server/actions/maptiler", () => ({
	geocodeAddress: vi.fn(),
	reverseGeocode: vi.fn(),
}));

let lastFormConfig: {
	fields?: Array<Record<string, unknown>>;
	initialValues?: Record<string, unknown>;
	onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
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
	});

	// This component no longer creates anything itself (no createSubmission call) —
	// it's a pure client-side data collector. The Submission gets created later,
	// atomically with the answers, at the final questionnaire submit.
	it("hands the raw form data to onCreated without writing anything itself", async () => {
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
			newCategory: "Archiv, Werkstatt",
			"address.streetLine": "Musterstraße 1",
			"address.zip": "12345",
			"address.city": "Berlin",
		};
		screen.getByText("mock-form-submit").click();

		expect(onCreated).toHaveBeenCalledWith(lastSubmitData);
	});

	it("pre-fills the form from the initialValues prop (e.g. after going back and forward again)", () => {
		const initialValues = { name: "Previously typed name" };

		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				initialValues={initialValues}
				onCreated={vi.fn()}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		expect(lastFormConfig?.initialValues).toBe(initialValues);
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
			"address.streetLine",
			"address.address_suffix",
			"address.zip",
			"address.city",
			"established_since",
		]);
	});

	it("requires street, zip and city but not established_since", () => {
		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				onCreated={vi.fn()}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		const basicFields = (
			lastFormConfig?.fields?.[0] as {
				fields: Array<{ name: string; required?: boolean }>;
			}
		).fields;
		const requiredNames = basicFields
			.filter((field) => field.required)
			.map((field) => field.name);

		expect(requiredNames).toEqual([
			"name",
			"address.streetLine",
			"address.zip",
			"address.city",
		]);
	});

	const draftWithLocation = {
		"address.lat": 52.52,
		"address.lng": 13.405,
		"address.district": "Mitte",
		"address.neighbourhood": "Mitte",
	};

	it("keeps map-derived district/neighbourhood from initialValues while the location is unchanged", () => {
		const onCreated = vi.fn();

		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				initialValues={draftWithLocation}
				onCreated={onCreated}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		lastSubmitData = {
			name: "Test Kulturort",
			"address.city": "Berlin",
			"address.lat": 52.52,
			"address.lng": 13.405,
		};
		screen.getByText("mock-form-submit").click();

		expect(onCreated).toHaveBeenCalledWith({
			"address.district": "Mitte",
			"address.neighbourhood": "Mitte",
			name: "Test Kulturort",
			"address.city": "Berlin",
			"address.lat": 52.52,
			"address.lng": 13.405,
		});
	});

	it("drops the draft's district/neighbourhood once the location has changed", () => {
		const onCreated = vi.fn();

		render(
			<QuestionnaireInstitutionCreateForm
				categoryGroups={[]}
				initialValues={draftWithLocation}
				onCreated={onCreated}
				onBack={vi.fn()}
				backLabel="Zurück"
				submitLabel="Weiter"
			/>,
		);

		lastSubmitData = {
			name: "Test Kulturort",
			"address.city": "Potsdam",
			"address.lat": 52.39,
			"address.lng": 13.06,
		};
		screen.getByText("mock-form-submit").click();

		expect(onCreated).toHaveBeenCalledWith(lastSubmitData);
	});
});
