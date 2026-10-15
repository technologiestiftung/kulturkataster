import { describe, expect, it } from "vitest";
import { formatPartialDate, parsePartialDate } from "@/lib/utils/partialDate";
import { toDate } from "@/lib/utils/formUtils";

const utc = (year: number, month: number, day: number) =>
	new Date(Date.UTC(year, month - 1, day));

describe("parsePartialDate", () => {
	it("parses a full date, month + year and year only", () => {
		expect(parsePartialDate("15.05.2020")).toEqual(utc(2020, 5, 15));
		expect(parsePartialDate("5.3.2020")).toEqual(utc(2020, 3, 5));
		expect(parsePartialDate("05.2020")).toEqual(utc(2020, 5, 1));
		expect(parsePartialDate(" 2020 ")).toEqual(utc(2020, 1, 1));
	});

	it("rejects other formats and impossible dates", () => {
		expect(parsePartialDate("31.02.2020")).toBeNull();
		expect(parsePartialDate("13.2020")).toBeNull();
		expect(parsePartialDate("2020-05-15")).toBeNull();
		expect(parsePartialDate("15.05.")).toBeNull();
		expect(parsePartialDate("")).toBeNull();
	});
});

describe("formatPartialDate", () => {
	it("shows only the precision the date carries", () => {
		expect(formatPartialDate(utc(2020, 5, 15))).toBe("15.05.2020");
		expect(formatPartialDate(utc(2020, 5, 1))).toBe("05.2020");
		expect(formatPartialDate(utc(2020, 1, 1))).toBe("2020");
	});

	it("round-trips every accepted input format", () => {
		for (const input of ["15.05.2020", "05.2020", "2020"]) {
			const parsed = parsePartialDate(input);
			expect(parsed && formatPartialDate(parsed)).toBe(input);
		}
	});
});

describe("toDate with partial dates", () => {
	it("reads German day-first input instead of the JS month-first guess", () => {
		expect(toDate("01.05.2020")).toEqual(utc(2020, 5, 1));
		expect(toDate("05.2020")).toEqual(utc(2020, 5, 1));
	});

	it("returns null for an impossible partial date instead of rolling it over", () => {
		expect(toDate("31.02.2020")).toBeNull();
	});

	it("still parses ISO strings", () => {
		expect(toDate("2019-01-01T00:00:00.000Z")).toEqual(utc(2019, 1, 1));
	});
});
