import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/utils/csvUtils";

describe("parseCsv", () => {
	it("parses quoted fields with escaped quotes, delimiters and a BOM", () => {
		const csv = '﻿"ID","Name"\r\n"1","Theater ""Alpha"", Berlin"\r\n';
		expect(parseCsv(csv)).toEqual([
			["ID", "Name"],
			["1", 'Theater "Alpha", Berlin'],
		]);
	});

	it("detects semicolon separated files as saved by spreadsheet apps", () => {
		expect(parseCsv("ID;Name\n1;Alpha\n2;")).toEqual([
			["ID", "Name"],
			["1", "Alpha"],
			["2", ""],
		]);
	});

	it("keeps line breaks inside quoted fields and drops blank rows", () => {
		expect(parseCsv('ID,Notes\n1,"line one\nline two"\n\n,\n')).toEqual([
			["ID", "Notes"],
			["1", "line one\nline two"],
		]);
	});

	it("rejects an unterminated quoted field", () => {
		expect(() => parseCsv('ID,Notes\n1,"unfinished')).toThrow(
			"Unterminated quoted CSV field",
		);
	});
});
