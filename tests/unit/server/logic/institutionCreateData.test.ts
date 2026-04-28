import { describe, expect, it } from "vitest";
import { buildInstitutionCreateData } from "@/server/logic/institutionCreateData";

describe("buildInstitutionCreateData", () => {
	it("creates a related contact person from inline contact fields", () => {
		const result = buildInstitutionCreateData(
			{
				name: "Created institution",
				address: null,
				contact_person_first_name: "Anna",
				contact_person_last_name: "Beispiel",
				contact_person_email: "anna@example.com",
				contact_person_phone: "+49 30 654321",
			},
			"user-1",
		);

		expect(result.contact_person).toEqual({
			create: {
				first_name: "Anna",
				last_name: "Beispiel",
				email: "anna@example.com",
				phone: "+49 30 654321",
			},
		});
	});
});
