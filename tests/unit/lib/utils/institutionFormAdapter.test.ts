import { describe, expect, it } from "vitest";
import {
	buildInstitutionForFormFromDraft,
	buildInstitutionFormInitialValues,
} from "@/lib/utils/institutionFormAdapter";

describe("buildInstitutionForFormFromDraft", () => {
	it("keeps Date values for date fields", () => {
		const rentalEnd = new Date("2030-12-31T00:00:00.000Z");
		const establishedSince = new Date("2010-01-01T00:00:00.000Z");
		const establishedUntil = new Date("2035-12-31T00:00:00.000Z");

		const result = buildInstitutionForFormFromDraft({
			name: "Test",
			rental_contract_end: rentalEnd,
			established_since: establishedSince,
			established_until: establishedUntil,
		});

		expect(result.rental_contract_end).toBeInstanceOf(Date);
		expect(result.established_since).toBeInstanceOf(Date);
		expect(result.established_until).toBeInstanceOf(Date);
		expect(result.rental_contract_end?.toISOString()).toBe(
			"2030-12-31T00:00:00.000Z",
		);
		expect(result.established_since?.toISOString()).toBe(
			"2010-01-01T00:00:00.000Z",
		);
		expect(result.established_until?.toISOString()).toBe(
			"2035-12-31T00:00:00.000Z",
		);
	});

	it("prefers the original institution id for review edit flows", () => {
		const result = buildInstitutionForFormFromDraft({
			id: 999,
			entityId: 55,
			originalInstitution: {
				id: 55,
				name: "Existing Institution",
			},
			name: "Existing Institution",
		});

		expect(result.id).toBe(55);
	});

	it("maps district into direct institution form initial values", () => {
		const initialValues = buildInstitutionFormInitialValues({
			id: 10,
			name: "Test",
			address: {
				id: 20,
				street: "Skalitzer Str.",
				street_number: "10",
				zipcode: "10999",
				city: "Berlin",
				district: "Friedrichshain-Kreuzberg",
				address_suffix: null,
				neighbourhood: "Kreuzberg",
				cultural_area: null,
				lat: 52.4986,
				lng: 13.4314,
				created_at: new Date(),
				updated_at: new Date(),
			},
			categories: [],
			tags: [],
			users: [],
			groups: [],
			created_at: new Date(),
			updated_at: new Date(),
		} as never);

		expect(initialValues["address.district"]).toBe(
			"Friedrichshain-Kreuzberg",
		);
	});

	it("maps district from flat draft fields into the draft edit institution", () => {
		const result = buildInstitutionForFormFromDraft({
			name: "Draft",
			"address.streetLine": "Skalitzer Str. 10",
			"address.city": "Berlin",
			"address.zip": "10999",
			"address.district": "Friedrichshain-Kreuzberg",
		});

		expect(result.address?.district).toBe("Friedrichshain-Kreuzberg");
	});

	it("hydrates categories from categoryFilters when categoryIds are missing", () => {
		const now = new Date();
		const result = buildInstitutionForFormFromDraft(
			{
				name: "Draft",
				categoryFilters: {
					district_keys: [],
					category_keys: ["music"],
					child_category_keys: ["club"],
					include_closed: false,
				},
			},
			[
				{
					id: 1,
					key: "music",
					description: null,
					icon: null,
					status: "active",
					parent_category_id: null,
					created_at: now,
					updated_at: now,
					child_categories: [
						{
							id: 2,
							key: "club",
							description: null,
							icon: null,
							status: "active",
							parent_category_id: 1,
							created_at: now,
							updated_at: now,
						},
					],
				},
			] as never,
		);

		expect(result.categories.map((category) => category.id).sort((a, b) => a - b))
			.toEqual([1, 2]);
	});

	it("hydrates contact person from originalInstitution fallback", () => {
		const result = buildInstitutionForFormFromDraft({
			name: "Draft",
			originalInstitution: {
				id: 55,
				contact_person: {
					first_name: "Ada",
					last_name: "Lovelace",
					email: "ada@example.com",
					phone: "030123456",
				},
			},
		});

		expect(result.contact_person?.first_name).toBe("Ada");
		expect(result.contact_person?.last_name).toBe("Lovelace");
		expect(result.contact_person?.email).toBe("ada@example.com");
		expect(result.contact_person?.phone).toBe("030123456");
	});
});
