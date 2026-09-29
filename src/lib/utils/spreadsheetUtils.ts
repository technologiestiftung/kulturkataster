import * as XLSX from "xlsx";

type ParsedSpreadsheet = {
	rows: string[][];
	// 1-based sheet row of the header, so issues can point at the real Excel row.
	headerRowNumber: number;
};

// SSF ships untyped; only the two helpers needed for date cells are declared here.
const ssf = XLSX.SSF as {
	is_date: (format: string) => boolean;
	parse_date_code: (value: number) => { y: number; m: number; d: number };
};

const pad = (value: number) => String(value).padStart(2, "0");

const toIsoDate = (serial: number) => {
	const { y, m, d } = ssf.parse_date_code(serial);
	return `${y}-${pad(m)}-${pad(d)}`;
};

// Exports write every cell as localized text; cells edited in Excel may become numbers or dates.
const readCellText = (cell: XLSX.CellObject | undefined): string => {
	if (!cell || cell.v === undefined || cell.v === null) return "";
	if (cell.t === "n" && typeof cell.v === "number") {
		return typeof cell.z === "string" && ssf.is_date(cell.z)
			? toIsoDate(cell.v)
			: String(cell.v);
	}
	return String(cell.w ?? cell.v);
};

const trimTrailingEmptyCells = (row: string[]) => {
	let end = row.length;
	while (end > 0 && row[end - 1].trim().length === 0) end--;
	return row.slice(0, end);
};

// Dense sheets only hold stored cells, so a huge declared range cannot blow up the loop.
const readSheetRows = (sheet: XLSX.DenseWorkSheet): string[][] =>
	Array.from(sheet["!data"] ?? [], (row) =>
		trimTrailingEmptyCells(Array.from(row ?? [], readCellText)),
	);

// Exports put a merged notice above the table, so the header is the first row with several cells.
const findHeaderIndex = (rows: string[][]) =>
	rows.findIndex(
		(row) => row.filter((cell) => cell.trim().length > 0).length > 1,
	);

/**
 * Reads the first sheet of an .xlsx file as text rows, starting at the header.
 * Rows that contain only empty cells are dropped; shorter rows are padded to the header width.
 */
export function parseSpreadsheet(data: ArrayBuffer): ParsedSpreadsheet {
	const workbook = XLSX.read(new Uint8Array(data), {
		type: "array",
		dense: true,
		cellNF: true,
		cellHTML: false,
		cellFormula: false,
	});
	const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""] as
		| XLSX.DenseWorkSheet
		| undefined;
	if (!sheet) throw new Error("Spreadsheet has no worksheet");

	const allRows = readSheetRows(sheet);
	const headerIndex = findHeaderIndex(allRows);
	if (headerIndex === -1) return { rows: [], headerRowNumber: 1 };

	const width = allRows[headerIndex].length;
	const rows = allRows
		.slice(headerIndex)
		.filter((row) => row.some((cell) => cell.trim().length > 0))
		.map((row) =>
			row.length < width
				? [...row, ...Array<string>(width - row.length).fill("")]
				: row,
		);
	return { rows, headerRowNumber: headerIndex + 1 };
}
