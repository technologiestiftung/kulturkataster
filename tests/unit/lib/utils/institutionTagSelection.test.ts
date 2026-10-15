import { describe, expect, it } from "vitest";
import {
	splitTagSelection,
	toNewTagValue,
} from "@/lib/utils/institutionTagSelection";

describe("splitTagSelection", () => {
	it("separates existing tag ids from tags typed in the form", () => {
		expect(
			splitTagSelection(["7", toNewTagValue(" Jazz "), "abc", "0", 3]),
		).toEqual({ tagIds: [7], newTagNames: ["Jazz"] });
	});

	it("returns empty lists for a missing value", () => {
		expect(splitTagSelection(undefined)).toEqual({
			tagIds: [],
			newTagNames: [],
		});
	});
});
