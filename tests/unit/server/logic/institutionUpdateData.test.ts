import { describe, expect, it } from "vitest";
import { buildInstitutionUpdateData } from "@/server/logic/institutionUpdateData";

describe("buildInstitutionUpdateData", () => {
	it("preserves explicit null clears for nullable institution fields", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
				area: null,
				number_of_rooms: null,
				owner_type: null,
				rental_contract_type: null,
				rental_contract_end: null,
				funding_type: null,
				utilization_status: null,
				protection_status: null,
				shared_use_allowed: null,
				capacity: null,
				established_since: null,
				established_until: null,
			},
			"user-1",
		);

		expect(result).toEqual(
			expect.objectContaining({
				name: "Updated institution",
				area: null,
				number_of_rooms: null,
				owner_type: null,
				rental_contract_type: null,
				rental_contract_end: null,
				funding_type: null,
				utilization_status: null,
				protection_status: null,
				shared_use_allowed: null,
				capacity: null,
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

	it("keeps omitted nullable institution fields unchanged", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
			},
			"user-1",
		);

		expect(result.website).toBeUndefined();
		expect(result.phone).toBeUndefined();
		expect(result.email).toBeUndefined();
		expect(result.parent_organization).toBeUndefined();
		expect(result.notes).toBeUndefined();
	});

	it("updates an existing address with only provided subfields", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: {
					id: 12,
					street: "Updated Street",
				},
			},
			"user-1",
		);

		expect(result.address).toEqual({
			update: { street: "Updated Street" },
			create: { street: "Updated Street" },
		});
	});

	it("upserts a related contact person from inline contact fields", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
				contact_person_first_name: "Anna",
				contact_person_last_name: "Beispiel",
				contact_person_email: "anna@example.com",
				contact_person_phone: "+49 30 654321",
			},
			"user-1",
		);

		expect(result.contact_person).toEqual({
			upsert: {
				create: {
					first_name: "Anna",
					last_name: "Beispiel",
					email: "anna@example.com",
					phone: "+49 30 654321",
				},
				update: {
					first_name: "Anna",
					last_name: "Beispiel",
					email: "anna@example.com",
					phone: "+49 30 654321",
				},
			},
		});
	});

	it("disconnects contact person when inline contact fields are explicitly cleared", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
				contact_person_first_name: null,
				contact_person_last_name: null,
				contact_person_email: null,
				contact_person_phone: null,
			},
			"user-1",
		);

		expect(result.contact_person).toEqual({ disconnect: true });
	});

	it("updates only provided inline contact fields", () => {
		const result = buildInstitutionUpdateData(
			{
				id: 1,
				name: "Updated institution",
				address: null,
				contact_person_email: "new@example.com",
			},
			"user-1",
		);

		expect(result.contact_person).toEqual({
			upsert: {
				create: {
					email: "new@example.com",
				},
				update: {
					email: "new@example.com",
				},
			},
		});
	});
});
