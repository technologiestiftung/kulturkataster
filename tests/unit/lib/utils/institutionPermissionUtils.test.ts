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

	it("normalizes the subcategory table column to the subcategories permission", () => {
		expect(normalizeInstitutionPermissionField("subcategory")).toBe(
			"subcategories",
		);
	});
});
