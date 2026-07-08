import { describe, expect, it } from "vitest";
import {
	inheritInstitutionRelationFields,
	normalizeInstitutionRelationFields,
	withProfileContactFallback,
} from "@/lib/utils/institutionRelationFields";

describe("institution relation field helpers", () => {
	it("normalizes flat address and contact person fields into nested relation data", () => {
		const result = normalizeInstitutionRelationFields({
			"address.streetLine": "Main 12",
			"address.zip": "10115",
			"address.city": "Berlin",
			"address.cultural_area": "Zentrum",
			contact_person_first_name: "Ada",
			contact_person_last_name: "Lovelace",
			contact_person_email: "ada@example.de",
			contact_person_phone: "+49 30 000000",
		});

		expect(result.address).toMatchObject({
			street: "Main",
			street_number: "12",
			zipcode: "10115",
			city: "Berlin",
			cultural_area: "Zentrum",
		});
		expect(result.contact_person).toEqual({
			first_name: "Ada",
			last_name: "Lovelace",
			email: "ada@example.de",
			phone: "+49 30 000000",
		});
	});

	it("does not add blank address subfields when normalizing sparse flat address updates", () => {
		const result = normalizeInstitutionRelationFields({
			"address.city": "Potsdam",
		});

		expect(result.address).toEqual({
			city: "Potsdam",
		});
		expect(result.address).not.toHaveProperty("street");
		expect(result.address).not.toHaveProperty("zipcode");
		expect(result.address).not.toHaveProperty("lat");
	});

	it("preserves existing relation subfields when a partial update only changes one subfield", () => {
		const result = inheritInstitutionRelationFields(
			{
				address: {
					city: "Potsdam",
				},
				contact_person: {
					email: "new@example.de",
				},
			},
			{
				address: {
					id: 1,
					street: "Main",
					street_number: "12",
					zipcode: "10115",
					city: "Berlin",
				},
				contact_person: {
					id: 2,
					first_name: "Ada",
					last_name: "Lovelace",
					email: "ada@example.de",
					phone: "+49 30 000000",
				},
			},
		);

		expect(result.address).toEqual({
			id: 1,
			street: "Main",
			street_number: "12",
			zipcode: "10115",
			city: "Potsdam",
		});
		expect(result.contact_person).toEqual({
			id: 2,
			first_name: "Ada",
			last_name: "Lovelace",
			email: "new@example.de",
			phone: "+49 30 000000",
		});
	});

	it("fills missing or empty contact person fields from the current profile", () => {
		const result = withProfileContactFallback(
			{
				contact_person_first_name: "",
				contact_person_last_name: undefined,
				contact_person_email: null,
				contact_person_phone: "+49 30 000",
			},
			{
				first_name: "Test",
				last_name: "User",
				email: "test.user@example.com",
				phone: "+49 30 000000",
			},
		);

		expect(result).toMatchObject({
			contact_person_first_name: "Test",
			contact_person_last_name: "User",
			contact_person_email: "test.user@example.com",
			contact_person_phone: "+49 30 000",
		});
	});
});
