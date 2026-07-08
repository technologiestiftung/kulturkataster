import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstitutionCard } from "@/components/ListView/InstitutionCard";
import type {
	InfoWrapperConfig,
	InfoWrapperFieldConfig,
} from "@/components/InfoWrapper/types";
import type { Institution } from "@/types";

const { infoWrapperMock } = vi.hoisted(() => ({
	infoWrapperMock: vi.fn(),
}));

vi.mock("@/components/InfoWrapper", () => ({
	InfoWrapper: (props: { config: InfoWrapperConfig }) => {
		infoWrapperMock(props);
		return null;
	},
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock("@/lib/hooks/useFieldLabel", () => ({
	useFieldLabel: () => (field: string) => field,
}));

vi.mock("@/lib/hooks/useInstitutionPrivateFieldResolver", () => ({
	useInstitutionPrivateFieldResolver: () => ({
		isPrivateField: () => false,
	}),
}));

const collectFieldValues = (fields: InfoWrapperFieldConfig[]): string[] =>
	fields.flatMap((field) => [
		typeof field.value === "string" ? field.value : "",
		...(field.type === "section" ? collectFieldValues(field.fields) : []),
	]);

describe("InstitutionCard", () => {
	beforeEach(() => {
		infoWrapperMock.mockReset();
	});

	it("passes nested address and contact person subfields to InfoWrapper", () => {
		render(
			<InstitutionCard
				institutionData={
					{
						id: 1,
						name: "Alpha",
						address: {
							street: "Main",
							street_number: "1",
							city: "Berlin",
							cultural_area: "Zentrum",
						},
						contact_person: {
							first_name: "Ada",
							last_name: "Lovelace",
							email: "ada@example.de",
							phone: "+49 30 123",
						},
					} as Institution
				}
			/>,
		);

		const config = infoWrapperMock.mock.calls[0][0].config as InfoWrapperConfig;
		const fieldValues = collectFieldValues(config.fields);

		expect(fieldValues).toEqual(
			expect.arrayContaining([
				"address",
				"contact_person.first_name",
				"contact_person.last_name",
				"contact_person.email",
				"contact_person.phone",
				"address.cultural_area",
			]),
		);
		expect(fieldValues).not.toEqual(
			expect.arrayContaining([
				"contact_person_first_name",
				"contact_person_email",
				"cultural_area",
			]),
		);
	});
});
