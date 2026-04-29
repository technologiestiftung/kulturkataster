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
});
