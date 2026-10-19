import { describe, expect, it } from "vitest";
import { hasReadableCultureIndex } from "@/lib/constants/cultureIndexRanges";

describe("hasReadableCultureIndex", () => {
	it("is true when the data carries culture_index, even without a value", () => {
		expect(
			hasReadableCultureIndex([{ id: 1 }, { id: 2, culture_index: null }]),
		).toBe(true);
	});

	it("is false when the field was redacted from every place", () => {
		expect(hasReadableCultureIndex([{ id: 1 }, { id: 2 }])).toBe(false);
	});

	it("is false without data", () => {
		expect(hasReadableCultureIndex(null)).toBe(false);
		expect(hasReadableCultureIndex([])).toBe(false);
	});
});
