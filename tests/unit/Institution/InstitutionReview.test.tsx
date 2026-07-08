import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InstitutionReview } from "@/components/Institution/InstitutionReview";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key.replace(/^content\./, ""),
		i18n: { resolvedLanguage: "de" },
	}),
}));

vi.mock("@/lib/hooks/useFieldLabel", () => ({
	useFieldLabel: () => (key: string) => key,
}));

vi.mock("@/lib/hooks/useInstitutionPrivateFieldResolver", () => ({
	useInstitutionPrivateFieldResolver: () => ({
		isPrivateField: () => false,
	}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			categories: Array<Record<string, unknown>>;
		}) => unknown,
	) => selector({ categories: [] }),
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: {
			categories: Array<Record<string, unknown>>;
		}) => unknown,
	) => selector({ categories: [] }),
}));

describe("InstitutionReview", () => {
	it("normalizes flat draft address fields for address display", () => {
		render(
			<InstitutionReview
				data={{
					name: "Draft Institution",
					"address.streetLine": "Main Street 12",
					"address.zip": "10115",
					"address.city": "Berlin",
					"address.district": "Mitte",
					"address.address_suffix": "Haus A",
				}}
			/>,
		);

		expect(screen.getAllByText("Draft Institution").length).toBeGreaterThan(0);
		expect(screen.getByText("Haus A")).toBeInTheDocument();
		expect(screen.getByText("Main Street 12")).toBeInTheDocument();
		expect(screen.getByText("10115")).toBeInTheDocument();
		expect(screen.getByText("Berlin-Mitte")).toBeInTheDocument();
	});

	it("normalizes flat address fields in update review data", () => {
		render(
			<InstitutionReview
				data={{
					name: "Original Institution",
					address: {
						street: "Old Street",
						street_number: "1",
						zipcode: "10115",
						city: "Berlin",
						district: "Mitte",
					},
				}}
				newData={{
					name: "Original Institution",
					"address.streetLine": "New Street 2",
					"address.zip": "10999",
					"address.city": "Berlin",
					"address.district": "Kreuzberg",
					"address.address_suffix": "Hof",
				}}
			/>,
		);

		expect(
			screen.getByText(
				/Original Institution, Old Street 1, 10115 Berlin Mitte/,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/Original Institution, Hof, New Street 2, 10999 Berlin Kreuzberg/,
			),
		).toBeInTheDocument();
	});

	it("does not mark an unchanged flat address as edited when review data omits the institution name", () => {
		render(
			<InstitutionReview
				data={{
					name: "Original Institution",
					address: {
						street: "Same Street",
						street_number: "12",
						zipcode: "10115",
						city: "Berlin",
						district: "Mitte",
					},
				}}
				newData={{
					"address.streetLine": "Same Street 12",
					"address.zip": "10115",
					"address.city": "Berlin",
					"address.district": "Mitte",
				}}
			/>,
		);

		expect(
			screen.queryByText("infoWrapper.diffLabel.edited"),
		).not.toBeInTheDocument();
	});

	it("does not mark the Wolf Kino address as edited when unchanged subfields are omitted", () => {
		render(
			<InstitutionReview
				data={{
					name: "Wolf Kino",
					address: {
						street: "Weserstraße",
						street_number: "12",
						zipcode: "12047",
						city: "Berlin",
						district: "Neukölln",
					},
				}}
				newData={{
					name: "Wolf Kino",
					"address.streetLine": "Weserstraße 12",
					"address.zip": "12047",
					"address.city": "Berlin",
				}}
			/>,
		);

		expect(
			screen.queryByText("infoWrapper.diffLabel.edited"),
		).not.toBeInTheDocument();
		expect(screen.getAllByText("Wolf Kino").length).toBeGreaterThan(0);
		expect(screen.getByText("Weserstraße 12")).toBeInTheDocument();
		expect(screen.getByText("12047")).toBeInTheDocument();
		expect(screen.getByText("Berlin-Neukölln")).toBeInTheDocument();
	});

	it("preserves omitted contact person subfields when only one subfield is updated", () => {
		render(
			<InstitutionReview
				data={{
					name: "Original Institution",
					contact_person: {
						first_name: "Ada",
						last_name: "Lovelace",
						email: "old@example.com",
						phone: "+49 30 000000",
					},
				}}
				newData={{
					contact_person_email: "new@example.com",
				}}
			/>,
		);

		expect(screen.getByText("Ada")).toBeInTheDocument();
		expect(screen.getByText("Lovelace")).toBeInTheDocument();
		expect(screen.getByText("+49 30 000000")).toBeInTheDocument();
		expect(screen.getByText("old@example.com")).toBeInTheDocument();
		expect(screen.getByText("new@example.com")).toBeInTheDocument();
		expect(screen.getAllByText("infoWrapper.diffLabel.edited")).toHaveLength(1);
	});

	it("normalizes flat draft contact person fields for nested display config", () => {
		render(
			<InstitutionReview
				data={{
					name: "Draft Institution",
					contact_person_first_name: "Ada",
					contact_person_last_name: "Lovelace",
					contact_person_email: "ada@example.com",
					contact_person_phone: "+49 30 000000",
				}}
			/>,
		);

		expect(screen.getByText("Ada")).toBeInTheDocument();
		expect(screen.getByText("Lovelace")).toBeInTheDocument();
		expect(screen.getByText("ada@example.com")).toBeInTheDocument();
		expect(screen.getByText("+49 30 000000")).toBeInTheDocument();
	});

	it("does not overwrite nested contact person fields with undefined flat keys", () => {
		render(
			<InstitutionReview
				data={{
					name: "Draft Institution",
					contact_person: {
						first_name: "Ada",
						last_name: "Lovelace",
						email: "ada@example.com",
						phone: "+49 30 000000",
					},
					contact_person_first_name: undefined,
					contact_person_last_name: undefined,
					contact_person_email: undefined,
					contact_person_phone: undefined,
				}}
			/>,
		);

		expect(screen.getByText("Ada")).toBeInTheDocument();
		expect(screen.getByText("Lovelace")).toBeInTheDocument();
		expect(screen.getByText("ada@example.com")).toBeInTheDocument();
		expect(screen.getByText("+49 30 000000")).toBeInTheDocument();
	});
});
