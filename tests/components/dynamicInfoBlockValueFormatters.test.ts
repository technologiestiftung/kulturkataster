import { describe, expect, it } from "vitest";
import {
	formatFieldValue,
	hasDisplayValue,
} from "@/components/Institution/DynamicInfoBlock/valueFormatters";

describe("DynamicInfoBlock valueFormatters", () => {
	it("treats valid dates as displayable", () => {
		const value = new Date("2020-01-01T00:00:00.000Z");
		expect(hasDisplayValue(value)).toBe(true);
	});

	it("treats invalid dates as not displayable", () => {
		const value = new Date("invalid");
		expect(hasDisplayValue(value)).toBe(false);
	});

	it("formats year values from dates", () => {
		const value = "2020-06-15T00:00:00.000Z";
		expect(formatFieldValue(value, { valueType: "year" })).toBe(2020);
	});

	it("formats boolean values using translations", () => {
		const tCommon = (key: string) => (key === "yes" ? "Ja" : "Nein");
		expect(formatFieldValue(true, { valueType: "boolean", tCommon })).toBe(
			"Ja",
		);
		expect(formatFieldValue(false, { valueType: "boolean", tCommon })).toBe(
			"Nein",
		);
	});

	it("formats enum values using the enum translator", () => {
		const tEnum = (key: string) => `translated:${key}`;
		expect(
			formatFieldValue("open", {
				valueType: "enum",
				enumKey: "utilization_status",
				tEnum,
			}),
		).toBe("translated:utilization_status.open");
	});
});
