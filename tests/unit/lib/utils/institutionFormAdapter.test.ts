import { describe, expect, it } from "vitest";
import type { Institution } from "@/types/institution";
import {
	buildInstitutionForFormFromDraft,
	buildInstitutionFormInitialValues,
} from "@/lib/utils/institutionFormAdapter";

const baseInstitution = {
	categories: [],
	tags: [],
	users: [],
	groups: [],
	created_at: new Date(),
	updated_at: new Date(),
} satisfies Partial<Institution>;

const asInstitution = (value: Partial<Institution>) =>
	value as unknown as Institution;

describe("buildInstitutionFormInitialValues - shared_use_allowed", () => {
	it("initialises shared_use_allowed as boolean true when institution has true", () => {
		const result = buildInstitutionFormInitialValues(
			asInstitution({
				...baseInstitution,
				id: 1,
				name: "Test",
				shared_use_allowed: true,
			}),
		);
		expect(result.shared_use_allowed).toBe(true);
	});

	it("initialises shared_use_allowed as boolean false when institution has false", () => {
		const result = buildInstitutionFormInitialValues(
			asInstitution({
				...baseInstitution,
				id: 1,
				name: "Test",
				shared_use_allowed: false,
			}),
		);
		expect(result.shared_use_allowed).toBe(false);
	});

	it("initialises shared_use_allowed as null when institution field is missing", () => {
		const result = buildInstitutionFormInitialValues(
			asInstitution({
				...baseInstitution,
				id: 1,
				name: "Test",
			}),
		);
		expect(result.shared_use_allowed).toBeNull();
	});

	it("initialises shared_use_allowed as null when institution has null", () => {
		const result = buildInstitutionFormInitialValues(
			asInstitution({
				...baseInstitution,
				id: 1,
				name: "Test",
				shared_use_allowed: null,
			}),
		);
		expect(result.shared_use_allowed).toBeNull();
	});

	it("does not initialise shared_use_allowed as a string", () => {
		const result = buildInstitutionFormInitialValues(
			asInstitution({
				...baseInstitution,
				id: 1,
				name: "Test",
				shared_use_allowed: true,
			}),
		);
		expect(typeof result.shared_use_allowed).toBe("boolean");
	});
});

describe("buildInstitutionForFormFromDraft - shared_use_allowed", () => {
	it("maps boolean true to boolean true", () => {
		const result = buildInstitutionForFormFromDraft({
			name: "Draft",
			shared_use_allowed: true,
		});
		expect(result.shared_use_allowed).toBe(true);
	});

	it("maps boolean false to boolean false", () => {
		const result = buildInstitutionForFormFromDraft({
			name: "Draft",
			shared_use_allowed: false,
		});
		expect(result.shared_use_allowed).toBe(false);
	});

	it("maps missing shared_use_allowed to null", () => {
		const result = buildInstitutionForFormFromDraft({ name: "Draft" });
		expect(result.shared_use_allowed).toBeNull();
	});

	it("maps null shared_use_allowed to null", () => {
		const result = buildInstitutionForFormFromDraft({
			name: "Draft",
			shared_use_allowed: null,
		});
		expect(result.shared_use_allowed).toBeNull();
	});
});

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

		expect(initialValues["address.district"]).toBe("Friedrichshain-Kreuzberg");
	});

	it("sanitizes legacy placeholder strings in numeric initial values", () => {
		const initialValues = buildInstitutionFormInitialValues(
			asInstitution({
				...baseInstitution,
				id: 11,
				name: "Legacy",
				area: "-" as never,
				number_of_rooms: "-" as never,
				capacity: "25" as never,
			}),
		);

		expect(initialValues.area).toBeUndefined();
		expect(initialValues.number_of_rooms).toBeUndefined();
		expect(initialValues.capacity).toBe(25);
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

		expect(
			result.categories.map((category) => category.id).sort((a, b) => a - b),
		).toEqual([1, 2]);
	});

	it("builds category filters from raw categoryIds when categories are not expanded", () => {
		const now = new Date();
		const initialValues = buildInstitutionFormInitialValues(
			{
				id: 20,
				name: "Test",
				categories: [],
				tags: [],
				users: [],
				groups: [],
				created_at: now,
				updated_at: now,
				categoryIds: [1, 2],
			} as never,
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

		expect(initialValues.categoryIds).toEqual(["1", "2"]);
		expect(initialValues.categoryFilters).toEqual({
			district_keys: [],
			category_keys: ["music"],
			child_category_keys: ["club"],
			culture_index_ranges: [],
			include_closed: false,
			status: undefined,
		});
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

	it("hydrates relation subfields from nested data while flat draft edits take precedence", () => {
		const result = buildInstitutionForFormFromDraft({
			name: "Draft",
			address: {
				id: 11,
				street: "Nested Street",
				street_number: "5",
				zipcode: "10115",
				city: "Berlin",
				cultural_area: "Zentrum",
				lat: 52.52,
				lng: 13.405,
			},
			contact_person: {
				id: 22,
				first_name: "Ada",
				last_name: "Lovelace",
				email: "ada@example.com",
				phone: "+49 30 000000",
			},
			"address.city": "Potsdam",
			contact_person_email: "updated@example.com",
		});

		expect(result.address).toMatchObject({
			id: 11,
			street: "Nested Street",
			street_number: "5",
			zipcode: "10115",
			city: "Potsdam",
			cultural_area: "Zentrum",
			lat: 52.52,
			lng: 13.405,
		});
		expect(result.contact_person).toMatchObject({
			id: 22,
			first_name: "Ada",
			last_name: "Lovelace",
			email: "updated@example.com",
			phone: "+49 30 000000",
		});
	});
});
