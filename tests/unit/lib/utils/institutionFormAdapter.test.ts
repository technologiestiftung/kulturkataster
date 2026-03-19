import { describe, expect, it } from "vitest";
import { buildInstitutionForFormFromDraft } from "@/lib/utils/institutionFormAdapter";

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
});
