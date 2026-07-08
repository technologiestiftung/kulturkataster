import { describe, expect, it } from "vitest";
import {
	contactInfoConfig,
	detailsInfoConfig,
	facilityInfoConfig,
	organizationInfoConfig,
	sharedUseInfoConfig,
} from "@/config/infoConfig/configs";

describe("detailsInfoConfig", () => {
	it("renders closing_reason through enum translations", () => {
		expect(detailsInfoConfig).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					value: "closing_reason",
					type: "enum",
					enumKey: "closing_reason",
				}),
			]),
		);
	});

	it("reads cultural area from the nested address relation", () => {
		expect(detailsInfoConfig).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					value: "address.cultural_area",
					permissionField: "address.cultural_area",
					type: "text",
				}),
			]),
		);
	});
});

describe("sharedUseInfoConfig", () => {
	it("contains the complete shared-use field block", () => {
		expect(sharedUseInfoConfig.map((field) => field.value)).toEqual([
			"shared_use_allowed",
			"shared_use_info",
			"shared_use_equipment",
			"shared_use_audience",
			"shared_use_availability",
			"accessibility",
			"cost",
			"shared_use_contact_person",
		]);
	});
});

describe("contactInfoConfig", () => {
	it("uses nested contact person relation paths", () => {
		const contactFields = contactInfoConfig.slice(3);

		expect(contactFields.map((field) => field.permissionField)).toEqual([
			"contact_person.first_name",
			"contact_person.last_name",
			"contact_person.email",
			"contact_person.phone",
		]);
		expect(contactFields.map((field) => field.value)).toEqual([
			"contact_person.first_name",
			"contact_person.last_name",
			"contact_person.email",
			"contact_person.phone",
		]);
	});
});

describe("facilityInfoConfig", () => {
	it("keeps only facility-specific fields", () => {
		expect(facilityInfoConfig.map((field) => field.value)).toEqual([
			"utilization_status_info",
			"utilization_status_internal_notes",
			"protection_status",
			"protection_status_info",
			"area",
			"number_of_rooms",
			"capacity",
		]);
	});
});

describe("organizationInfoConfig", () => {
	it("contains the organization funding fields", () => {
		expect(organizationInfoConfig.map((field) => field.value)).toEqual([
			"legal_form",
			"funding_type",
			"funding_sources",
		]);
	});
});
