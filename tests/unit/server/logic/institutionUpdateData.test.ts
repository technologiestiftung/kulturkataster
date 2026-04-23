import { describe, expect, it } from "vitest";
import { buildInstitutionUpdateData } from "@/server/logic/institutionUpdateData";

describe("buildInstitutionUpdateData", () => {
	it("preserves explicit null clears for nullable institution fields", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
				owner_type: null,
				rental_contract_type: null,
				rental_contract_end: null,
				funding_type: null,
				utilization_status: null,
				protection_status: null,
				shared_use_allowed: null,
				established_since: null,
				established_until: null,
			},
			"user-1",
		);

		expect(result).toEqual(
			expect.objectContaining({
				name: "Updated institution",
				owner_type: null,
				rental_contract_type: null,
				rental_contract_end: null,
				funding_type: null,
				utilization_status: null,
				protection_status: null,
				shared_use_allowed: null,
				established_since: null,
				established_until: null,
			}),
		);
	});

	it("keeps status unchanged unless a concrete value is provided", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
			},
			"user-1",
		);

		expect(result.status).toBeUndefined();
	});
});
