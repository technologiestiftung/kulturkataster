import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseSpreadsheet } from "@/lib/utils/spreadsheetUtils";

const toXlsx = (sheet: XLSX.WorkSheet) => {
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, sheet, "Kulturorte");
	return XLSX.write(workbook, {
		bookType: "xlsx",
		type: "array",
	}) as ArrayBuffer;
};

describe("parseSpreadsheet", () => {
	it("skips the notice rows and starts at the header", () => {
		const sheet = XLSX.utils.aoa_to_sheet([
			["Die Daten stammen vom Berliner Kulturkataster."],
			[],
			["ID", "Name", "Notizen"],
			["1", "Alpha"],
			[],
			["2", "Beta", "Zeile eins\nZeile zwei"],
		]);

		expect(parseSpreadsheet(toXlsx(sheet))).toEqual({
			rowNumbers: [3, 4, 6],
			rows: [
				["ID", "Name", "Notizen"],
				["1", "Alpha", ""],
				["2", "Beta", "Zeile eins\nZeile zwei"],
			],
		});
	});

	it("reads cells edited in Excel as plain numbers and ISO dates", () => {
		const sheet = XLSX.utils.aoa_to_sheet([
			["ID", "Fläche", "Seit"],
			[3, 120.5, new Date(Date.UTC(1999, 4, 1))],
		]);

		expect(parseSpreadsheet(toXlsx(sheet)).rows[1]).toEqual([
			"3",
			"120.5",
			"1999-05-01",
		]);
	});

	it("returns no rows for an empty file", () => {
		expect(parseSpreadsheet(new ArrayBuffer(0)).rows).toEqual([]);
	});
});
