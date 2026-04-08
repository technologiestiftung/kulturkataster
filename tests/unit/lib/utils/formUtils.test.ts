import { describe, expect, it } from "vitest";
import { buildInstitutionAddressPayload } from "@/lib/utils/formUtils";

describe("formUtils", () => {
	it("preserves district when building an institution address payload", () => {
		const payload = buildInstitutionAddressPayload({
			"address.streetLine": "Skalitzer Str. 10",
			"address.city": "Berlin",
			"address.zip": "10999",
			"address.district": "Friedrichshain-Kreuzberg",
			"address.address_suffix": "Haus A",
			"address.neighbourhood": "Kreuzberg",
			"address.cultural_area": "Sued",
			"address.lat": "52.4986",
			"address.lng": "13.4314",
		});

		expect(payload).toMatchObject({
			street: "Skalitzer Str.",
			street_number: "10",
			city: "Berlin",
			zipcode: "10999",
			district: "Friedrichshain-Kreuzberg",
			address_suffix: "Haus A",
			neighbourhood: "Kreuzberg",
			cultural_area: "Sued",
			lat: 52.4986,
			lng: 13.4314,
		});
	});
});
