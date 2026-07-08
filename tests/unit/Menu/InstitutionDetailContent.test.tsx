import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstitutionDetailContent } from "@/components/Menu/MenuContent/InstitutionDetailContent";
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

vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "1" }),
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/lib/hooks/useFieldLabel", () => ({
	useFieldLabel: () => (field: string) => field,
}));

vi.mock("@/lib/hooks/useInstitutionPrivateFieldResolver", () => ({
	useInstitutionPrivateFieldResolver: () => ({
		isPrivateField: () => false,
	}),
}));

vi.mock("@/lib/store/mapStore", () => ({
	useMapStore: (selector: (state: { map: null }) => unknown) =>
		selector({ map: null }),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			allInstitutions: Institution[];
			isLoading: boolean;
			error: null;
		}) => unknown,
	) =>
		selector({
			allInstitutions: [
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
				} as Institution,
			],
			isLoading: false,
			error: null,
		}),
}));

const collectFieldKeys = (fields: InfoWrapperFieldConfig[]): string[] =>
	fields.flatMap((field) => [
		field.id ?? "",
		typeof field.value === "string" ? field.value : "",
		...(field.type === "section" ? collectFieldKeys(field.fields) : []),
	]);

describe("InstitutionDetailContent", () => {
	beforeEach(() => {
		infoWrapperMock.mockReset();
	});

	it("passes nested address and contact person subfields to the side panel InfoWrapper", () => {
		render(<InstitutionDetailContent />);

		const config = infoWrapperMock.mock.calls[0][0].config as InfoWrapperConfig;
		const fieldKeys = collectFieldKeys(config.fields);

		expect(fieldKeys).toEqual(
			expect.arrayContaining([
				"address",
				"contact_person.first_name",
				"contact_person.last_name",
				"contact_person.email",
				"contact_person.phone",
				"address.cultural_area",
			]),
		);
		expect(fieldKeys).not.toEqual(
			expect.arrayContaining([
				"contact_person_first_name",
				"contact_person_email",
				"cultural_area",
			]),
		);
	});
});
