import { describe, expect, it } from "vitest";
import { validateInstitutionCreateInput } from "@/server/validation/institutions";

describe("validateInstitutionCreateInput", () => {
	it("accepts and normalizes phone numbers with invisible formatting characters", () => {
		const result = validateInstitutionCreateInput({
			name: "Test Institution",
			phone: "030 23613314‬",
			address: null,
		});

		expect(result.phone).toBe("030 23613314");
	});

	it("accepts culture index dimension scores and a text global assessment", () => {
		const result = validateInstitutionCreateInput({
			name: "Test Institution",
			address: null,
			culture_index_location: 0,
			culture_index_visibility: 100,
			culture_index_global: " Stable ",
		});

		expect(result.culture_index_location).toBe(0);
		expect(result.culture_index_visibility).toBe(100);
		expect(result.culture_index_global).toBe("Stable");
	});

	it("rejects culture index dimension scores outside 0 to 100", () => {
		expect(() =>
			validateInstitutionCreateInput({
				name: "Test Institution",
				address: null,
				culture_index_financial: 101,
			}),
		).toThrow();
	});
});
