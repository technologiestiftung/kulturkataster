import { describe, expect, it } from "vitest";
import type { FieldConfig } from "@/components/FormWrapper";
import { omitInstitutionFields } from "@/lib/utils/institutionFieldAccess";
import { CULTURE_INDEX_FIELDS } from "@/lib/constants/cultureIndexRanges";

describe("omitInstitutionFields", () => {
	it("removes culture index fields, including nested ones, and empty sections", () => {
		const fields = [
			{ name: "name", type: "text" },
			{ name: "culture_index", type: "number" },
			{
				name: "status",
				type: "section",
				fields: [
					{ name: "utilization_status", type: "select" },
					{ name: "culture_index_location", type: "number" },
				],
			},
			{
				name: "culture",
				type: "section",
				fields: [{ name: "culture_index_global", type: "textarea" }],
			},
		] as FieldConfig[];

		const result = omitInstitutionFields(fields, CULTURE_INDEX_FIELDS);

		expect(result).toEqual([
			{ name: "name", type: "text" },
			{
				name: "status",
				type: "section",
				fields: [{ name: "utilization_status", type: "select" }],
			},
		]);
	});
});
