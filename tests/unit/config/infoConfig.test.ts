import { describe, expect, it } from "vitest";
import {
	detailsInfoConfig,
	facilityInfoConfig,
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
