import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import type { FormWrapperFieldConfig } from "@/components/FormWrapper/types";
import { validateFieldValue } from "@/components/FormWrapper/validation";

const t = (key: string, options?: Record<string, unknown>) =>
	options ? `${key}:${options.min}-${options.max}` : key;
const tEnum = ((key: string) => key) as unknown as TFunction;

const scoreField = {
	name: "culture_index",
	type: "number",
	min: 0,
	max: 100,
} as FormWrapperFieldConfig;

const validate = (value: unknown) =>
	validateFieldValue(scoreField, value, {}, t, tEnum);

describe("number range validation", () => {
	it("accepts empty values and values within min and max", () => {
		expect(validate("")).toBeUndefined();
		expect(validate("0")).toBeUndefined();
		expect(validate("100")).toBeUndefined();
		expect(validate(42)).toBeUndefined();
	});

	it("rejects values outside min and max with a range message", () => {
		expect(validate("101")).toBe("common.form.validation.numberRange:0-100");
		expect(validate("-1")).toBe("common.form.validation.numberRange:0-100");
	});

	it("keeps the invalid number message for non-numeric input", () => {
		expect(validate("abc")).toBe("common.form.validation.invalidNumber");
	});
});
