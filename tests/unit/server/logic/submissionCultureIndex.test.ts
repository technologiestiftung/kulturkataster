import { describe, expect, it } from "vitest";
import type { AccessContext } from "@/server/utils/rbac";
import { stripUnreadableCultureIndex } from "@/server/logic/submissionCultureIndex";

const contextWithInstitutionReadFields = (fields: string[]): AccessContext =>
	({
		role: null,
		table: {},
		tableScope: {},
		field: {
			institution: Object.fromEntries(
				fields.map((field) => [field, new Set(["read"])]),
			),
		},
		fieldOrder: {},
		fieldPins: {},
	}) as unknown as AccessContext;

const payload = {
	data: {
		name: "Institution",
		culture_index: 42,
		culture_index_location: 30,
		culture_index_global: "Notes",
	},
	diff: { culture_index: 42, name: "Institution" },
};

describe("stripUnreadableCultureIndex", () => {
	it("drops culture index fields from data and diff without read permission", () => {
		const result = stripUnreadableCultureIndex(
			contextWithInstitutionReadFields(["name"]),
			payload,
		);

		expect(result.data).toEqual({ name: "Institution" });
		expect(result.diff).toEqual({ name: "Institution" });
	});

	it("keeps culture index fields for users who can read them", () => {
		const result = stripUnreadableCultureIndex(
			contextWithInstitutionReadFields(["name", "culture_index"]),
			payload,
		);

		expect(result).toBe(payload);
	});

	it("leaves missing or non-object data untouched", () => {
		const result = stripUnreadableCultureIndex(
			contextWithInstitutionReadFields([]),
			{ data: null, diff: undefined },
		);

		expect(result).toEqual({ data: null, diff: undefined });
	});
});
