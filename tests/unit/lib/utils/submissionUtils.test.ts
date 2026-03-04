import { describe, expect, it } from "vitest";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";

const baseAddress = {
	street: "Main",
	street_number: "1",
	zipcode: "12345",
	city: "Berlin",
	district: null,
	address_suffix: null,
	neighbourhood: null,
	cultural_area: null,
	lat: 52.5,
	lng: 13.4,
};

describe("institutionSubmissionToDraft", () => {
	it("maps fields from submission data", () => {
		const result = institutionSubmissionToDraft({
			data: {
				name: "Test Institution",
				website: "https://example.com",
				phone: "+49 30 123",
				email: "hello@example.com",
				parent_organization: "Parent Org",
				area: 120,
				number_of_rooms: 3,
				categoryIds: ["1", 2],
				userIds: ["user-1", "user-2"],
				address: baseAddress,
			},
		});

		expect(result.name).toBe("Test Institution");
		expect(result.website).toBe("https://example.com");
		expect(result.phone).toBe("+49 30 123");
		expect(result.email).toBe("hello@example.com");
		expect(result.parent_organization).toBe("Parent Org");
		expect(result.area).toBe(120);
		expect(result.number_of_rooms).toBe(3);
		expect(result.categoryIds).toEqual([1, 2]);
		expect(result.userIds).toEqual(["user-1", "user-2"]);
		expect(result.address).toEqual(baseAddress);
	});

	it("fills defaults for missing data", () => {
		const result = institutionSubmissionToDraft({ data: {} });
		expect(result.name).toBe("");
		expect(result.website).toBeUndefined();
		expect(result.phone).toBeUndefined();
		expect(result.email).toBeUndefined();
		expect(result.parent_organization).toBeUndefined();
		expect(result.categoryIds).toBeUndefined();
		expect(result.address).toBeNull();
	});

	it("maps optional numeric and boolean fields", () => {
		const result = institutionSubmissionToDraft({
			data: {
				area: 42,
				capacity: 120,
				shared_use_allowed: true,
				contact_person_id: 7,
			},
		});

		expect(result.area).toBe(42);
		expect(result.capacity).toBe(120);
		expect(result.shared_use_allowed).toBe(true);
		expect(result.contact_person_id).toBe(7);
	});

	it("normalizes tagged DateTime objects from submission JSON", () => {
		const result = institutionSubmissionToDraft({
			data: {
				rental_contract_end: {
					$type: "DateTime",
					value: "2010-01-01T00:00:00.000Z",
				},
				established_since: {
					$type: "DateTime",
					value: "2008-05-15T00:00:00.000Z",
				},
			},
		});

		expect(result.rental_contract_end).toBeInstanceOf(Date);
		expect((result.rental_contract_end as Date).toISOString()).toBe(
			"2010-01-01T00:00:00.000Z",
		);
		expect(result.established_since).toBeInstanceOf(Date);
		expect((result.established_since as Date).toISOString()).toBe(
			"2008-05-15T00:00:00.000Z",
		);
	});
});
