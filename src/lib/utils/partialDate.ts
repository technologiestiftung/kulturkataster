// Dates people often only know roughly (e.g. "established since") are typed as
// TT.MM.JJJJ, MM.JJJJ or JJJJ. They are stored as a full date at UTC midnight;
// a missing day/month falls back to the first of the month/year.
const FULL_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const MONTH_YEAR = /^(\d{1,2})\.(\d{4})$/;
const YEAR_ONLY = /^(\d{4})$/;

const toUtcDate = (year: number, month: number, day: number): Date | null => {
	const date = new Date(Date.UTC(year, month - 1, day));
	const isRealDate =
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day;
	return isRealDate ? date : null;
};

const matchParts = (value: string): [number, number, number] | null => {
	const full = FULL_DATE.exec(value);
	if (full) return [Number(full[3]), Number(full[2]), Number(full[1])];
	const monthYear = MONTH_YEAR.exec(value);
	if (monthYear) return [Number(monthYear[2]), Number(monthYear[1]), 1];
	const yearOnly = YEAR_ONLY.exec(value);
	if (yearOnly) return [Number(yearOnly[1]), 1, 1];
	return null;
};

export const isPartialDateInput = (value: string): boolean =>
	matchParts(value.trim()) !== null;

// Returns null for anything that isn't one of the three formats (or isn't a
// real calendar date, e.g. 31.02.2020).
export const parsePartialDate = (value: string): Date | null => {
	const parts = matchParts(value.trim());
	return parts ? toUtcDate(...parts) : null;
};

// Inverse of parsePartialDate: shows only as much precision as the stored date
// carries. A real 1 January therefore comes back as just the year.
export const formatPartialDate = (date: Date): string => {
	const year = String(date.getUTCFullYear());
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	if (day === "01" && month === "01") return year;
	if (day === "01") return `${month}.${year}`;
	return `${day}.${month}.${year}`;
};
