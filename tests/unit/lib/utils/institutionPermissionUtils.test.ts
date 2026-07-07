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
			contact_person_phone: "+49 30 123456",
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

	it("normalizes the subcategory table column to the subcategories permission", () => {
		expect(normalizeInstitutionPermissionField("subcategory")).toBe(
			"subcategories",
		);
	});
});
