const CSV_DELIMITER_CANDIDATES = [",", ";"] as const;

const stripBom = (text: string) =>
	text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

// Excel in German locales re-saves CSV files with ";" – detect it from the header line.
const detectDelimiter = (text: string) => {
	const headerLine = text.split(/\r?\n/, 1)[0] ?? "";
	const [comma, semicolon] = CSV_DELIMITER_CANDIDATES.map(
		(delimiter) => headerLine.split(delimiter).length,
	);
	return semicolon > comma ? ";" : ",";
};

/**
 * Parses RFC 4180 style CSV (quoted fields, escaped quotes, CRLF/LF line breaks).
 * Rows that contain only empty cells are dropped.
 */
export function parseCsv(input: string): string[][] {
	const text = stripBom(input);
	const delimiter = detectDelimiter(text);
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	const pushField = () => {
		row.push(field);
		field = "";
	};
	const pushRow = () => {
		pushField();
		if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
		row = [];
	};

	for (let index = 0; index < text.length; index++) {
		const char = text[index];

		if (inQuotes) {
			if (char === '"' && text[index + 1] === '"') {
				field += '"';
				index++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				field += char;
			}
			continue;
		}

		if (char === '"') {
			inQuotes = true;
		} else if (char === delimiter) {
			pushField();
		} else if (char === "\n") {
			pushRow();
		} else if (char !== "\r") {
			field += char;
		}
	}

	if (inQuotes) throw new Error("Unterminated quoted CSV field");
	if (field.length > 0 || row.length > 0) pushRow();
	return rows;
}
