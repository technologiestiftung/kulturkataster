import { describe, expect, it } from "vitest";
import {
	formatRowRanges,
	groupImportIssues,
} from "@/lib/utils/institutionImportIssues";

describe("groupImportIssues", () => {
	it("groups by column, problem and each unknown value", () => {
		expect(
			groupImportIssues([
				{ row: 2, column: "Tags", code: "unknownTag", values: ["Jazz"] },
				{
					row: 3,
					column: "Tags",
					code: "unknownTag",
					values: ["Folk", "Jazz"],
				},
				{ row: 3, column: "Kapazität", code: "invalidNumber" },
				{ row: 9, column: "Kapazität", code: "invalidNumber" },
			]),
		).toEqual([
			{ column: "Tags", code: "unknownTag", value: "Jazz", rows: [2, 3] },
			{ column: "Tags", code: "unknownTag", value: "Folk", rows: [3] },
			{
				column: "Kapazität",
				code: "invalidNumber",
				value: undefined,
				rows: [3, 9],
			},
		]);
	});
});

describe("formatRowRanges", () => {
	it("collapses consecutive rows into ranges", () => {
		expect(formatRowRanges([9, 2, 3, 4, 1551])).toEqual({
			text: "2–4, 9, 1551",
			hiddenCount: 0,
		});
	});

	it("shortens long lists and counts the rows left out", () => {
		const everyOtherRow = Array.from({ length: 20 }, (_, index) => index * 2);
		expect(formatRowRanges(everyOtherRow)).toMatchObject({ hiddenCount: 5 });
	});
});
