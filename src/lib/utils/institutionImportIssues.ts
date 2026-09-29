import type { ImportIssue, ImportIssueCode } from "@/types/institutionImport";

export type ImportIssueGroup = {
	column: string;
	code: ImportIssueCode;
	value?: string;
	rows: number[];
};

const MAX_LISTED_ROW_RANGES = 15;

/**
 * Collapses issues that share column, problem and unknown value into one entry,
 * so a missing tag reads as one line with all its rows instead of one line per row.
 */
export function groupImportIssues(issues: ImportIssue[]): ImportIssueGroup[] {
	const groups = new Map<string, ImportIssueGroup>();
	issues.forEach(({ row, column, code, values }) => {
		(values?.length ? values : [undefined]).forEach((value) => {
			const key = JSON.stringify([column, code, value ?? null]);
			const group = groups.get(key) ?? { column, code, value, rows: [] };
			if (!group.rows.includes(row)) group.rows.push(row);
			groups.set(key, group);
		});
	});
	return Array.from(groups.values());
}

const toRanges = (rows: number[]) =>
	[...rows]
		.sort((a, b) => a - b)
		.reduce<[number, number][]>((ranges, row) => {
			const last = ranges[ranges.length - 1];
			if (last && row === last[1] + 1) last[1] = row;
			else ranges.push([row, row]);
			return ranges;
		}, []);

/** Formats rows as "4, 7–9, 1551" and reports how many rows the shortened list leaves out. */
export function formatRowRanges(rows: number[]): {
	text: string;
	hiddenCount: number;
} {
	const ranges = toRanges(rows);
	const shown = ranges.slice(0, MAX_LISTED_ROW_RANGES);
	const hiddenCount = ranges
		.slice(MAX_LISTED_ROW_RANGES)
		.reduce((count, [start, end]) => count + end - start + 1, 0);
	return {
		text: shown
			.map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`))
			.join(", "),
		hiddenCount,
	};
}
