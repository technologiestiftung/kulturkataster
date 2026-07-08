import { describe, expect, it } from "vitest";
import {
	buildInstitutionPermissionFields,
	filterInstitutionInputByPermissionFields,
} from "@/lib/utils/institutionPermissionUtils";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";
import type { InstitutionForm } from "@/types/institution";

describe("institutionPermissionUtils", () => {
	it("builds permission fields with relation aliases", () => {
		const input = {
			name: "Test Institution",
			address: { street: "Main", city: "Berlin" },
			categoryIds: [1, 2],
			groupIds: [3],
			notes: "note",
		} as unknown as InstitutionForm;

		const fields = buildInstitutionPermissionFields(input);

		expect(fields).toEqual(
			expect.arrayContaining([
				"name",
				"address.street",
				"address.city",
				"categories",
				"groups",
				"notes",
			]),
		);
		expect(fields).not.toContain("categoryIds");
		expect(fields).not.toContain("groupIds");
	});

	it("filters input and keeps only allowed permission fields", () => {
		const input = {
			name: "Test Institution",
			address: { id: 7, street: "Main", city: "Berlin" },
			categoryIds: [1, 2],
			notes: "visible",
			internal_notes: "hidden",
		} as unknown as InstitutionForm;

		const filtered = filterInstitutionInputByPermissionFields(
			input,
			new Set(["name", "address.street", "categories"]),
		);

		expect(filtered).toEqual(
			expect.objectContaining({
				name: "Test Institution",
				address: { id: 7, street: "Main" },
				categoryIds: [1, 2],
			}),
		);
		expect(filtered).not.toHaveProperty("notes");
		expect(filtered).not.toHaveProperty("internal_notes");
	});

	it("filters address and contact person subfields independently", () => {
		const input = {
			name: "Test Institution",
			address: {
				id: 7,
				street: "Main",
				city: "Berlin",
				cultural_area: "Zentrum",
			},
			contact_person_first_name: "Ada",
			contact_person_last_name: "Lovelace",
			contact_person_email: "ada@example.com",
			contact_person_phone: "+49 30 000000",
		} as unknown as InstitutionForm;

		const fields = buildInstitutionPermissionFields(input);
		const filtered = filterInstitutionInputByPermissionFields(
			input,
			new Set([
				"name",
				"address.street",
				"address.cultural_area",
				"contact_person.email",
			]),
		);

		expect(fields).toEqual(
			expect.arrayContaining([
				"address.street",
				"address.city",
				"address.cultural_area",
				"contact_person.first_name",
				"contact_person.last_name",
				"contact_person.email",
				"contact_person.phone",
			]),
		);
		expect(filtered).toEqual({
			name: "Test Institution",
			address: {
				id: 7,
				street: "Main",
				cultural_area: "Zentrum",
			},
			contact_person_email: "ada@example.com",
		});
	});

	it("filters each address subfield independently while preserving the address id", () => {
		const input = {
			address: {
				id: 7,
				street: "Main",
				address_suffix: "Haus A",
				zipcode: "10115",
				city: "Berlin",
				district: "Mitte",
				neighbourhood: "Moabit",
				cultural_area: "Zentrum",
				lat: 52.52,
				lng: 13.405,
			},
		} as unknown as InstitutionForm;

		const fields = buildInstitutionPermissionFields(input);
		const filtered = filterInstitutionInputByPermissionFields(
			input,
			new Set([
				"address.address_suffix",
				"address.zipcode",
				"address.city",
				"address.district",
				"address.neighbourhood",
				"address.lat",
				"address.lng",
			]),
		);

		expect(fields).toEqual(
			expect.arrayContaining([
				"address.street",
				"address.address_suffix",
				"address.zipcode",
				"address.city",
				"address.district",
				"address.neighbourhood",
				"address.cultural_area",
				"address.lat",
				"address.lng",
			]),
		);
		expect(filtered).toEqual({
			address: {
				id: 7,
				address_suffix: "Haus A",
				zipcode: "10115",
				city: "Berlin",
				district: "Mitte",
				neighbourhood: "Moabit",
				lat: 52.52,
				lng: 13.405,
			},
		});
	});

	it("filters each contact person subfield independently", () => {
		const input = {
			contact_person_first_name: "Ada",
			contact_person_last_name: "Lovelace",
			contact_person_email: "ada@example.com",
			contact_person_phone: "+49 30 000000",
		} as unknown as InstitutionForm;

		const fields = buildInstitutionPermissionFields(input);
		const filtered = filterInstitutionInputByPermissionFields(
			input,
			new Set(["contact_person.first_name", "contact_person.phone"]),
		);

		expect(fields).toEqual(
			expect.arrayContaining([
				"contact_person.first_name",
				"contact_person.last_name",
				"contact_person.email",
				"contact_person.phone",
			]),
		);
		expect(filtered).toEqual({
			contact_person_first_name: "Ada",
			contact_person_phone: "+49 30 000000",
		});
	});

	it("normalizes the subcategory table column to the subcategories permission", () => {
		expect(normalizeInstitutionPermissionField("subcategory")).toBe(
			"subcategories",
		);
	});
});
