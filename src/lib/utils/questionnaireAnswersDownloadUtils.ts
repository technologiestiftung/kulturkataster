import * as XLSX from "xlsx-js-style";
import {
	downloadQuestionnaireAnswers,
	downloadAllQuestionnaireAnswers,
	type QuestionnaireAnswersExportErrorCode,
} from "@/server/actions/questionnaires";
import { getBlockMeta } from "@/lib/utils/questionnaireFormAdapter";

export type QuestionnaireDownloadFormat = "csv" | "xlsx";

type QuestionOption = {
	value: string | number | boolean;
	label: string;
};

type QuestionConfigShape = {
	options?: QuestionOption[];
	freeTextOption?: { value: string | number | boolean; label?: string };
	likertMatrix?: { rows: { key: string; label: string }[] };
};

const getConfig = (config: unknown): QuestionConfigShape =>
	(config as QuestionConfigShape | null) ?? {};

const resolveOptionLabel = (
	options: QuestionOption[] | undefined,
	rawValue: unknown,
): string | null => {
	const match = options?.find(
		(option) => String(option.value) === String(rawValue),
	);
	return match ? match.label : null;
};

function formatScalarValue(
	config: QuestionConfigShape,
	rawValue: unknown,
): string {
	if (rawValue === null || rawValue === undefined || rawValue === "") return "";
	if (typeof rawValue === "boolean") return rawValue ? "Ja" : "Nein";
	const optionLabel = resolveOptionLabel(config.options, rawValue);
	if (optionLabel) return optionLabel;
	if (
		config.freeTextOption &&
		String(config.freeTextOption.value) === String(rawValue)
	) {
		return config.freeTextOption.label ?? String(rawValue);
	}
	return String(rawValue);
}

const isFreeTextCombo = (
	value: unknown,
): value is { selected: unknown; freeText: unknown } =>
	typeof value === "object" &&
	value !== null &&
	!Array.isArray(value) &&
	"selected" in value &&
	"freeText" in value;

function formatFreeTextCombo(
	config: QuestionConfigShape,
	combo: { selected: unknown; freeText: unknown },
): string {
	const selectedLabel = formatScalarValue(config, combo.selected);
	const freeText = typeof combo.freeText === "string" ? combo.freeText : "";
	if (!freeText) return selectedLabel;
	return selectedLabel ? `${selectedLabel}: ${freeText}` : freeText;
}

function formatLikertMatrixValue(
	config: QuestionConfigShape,
	value: Record<string, unknown>,
): string {
	const rows = config.likertMatrix?.rows ?? [];
	return rows
		.map((row) => {
			const rowValue = value[row.key];
			if (rowValue === undefined || rowValue === null || rowValue === "") {
				return null;
			}
			return `${row.label}: ${formatScalarValue(config, rowValue)}`;
		})
		.filter((line): line is string => line !== null)
		.join("; ");
}

function formatAnswerValue(
	fieldType: string,
	rawConfig: unknown,
	value: unknown,
): string {
	if (value === null || value === undefined || value === "") return "";
	const config = getConfig(rawConfig);

	if (
		fieldType === "likertMatrix" &&
		typeof value === "object" &&
		!Array.isArray(value)
	) {
		return formatLikertMatrixValue(config, value as Record<string, unknown>);
	}
	if (isFreeTextCombo(value)) {
		return formatFreeTextCombo(config, value);
	}
	if (Array.isArray(value)) {
		return value.map((item) => formatScalarValue(config, item)).join("; ");
	}
	if (typeof value === "object") {
		return JSON.stringify(value);
	}
	return formatScalarValue(config, value);
}

function formatAnsweredAt(value: Date): string {
	const date = new Date(value);
	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const year = date.getUTCFullYear();
	return `${day}.${month}.${year}`;
}

function pxToExcelWidth(px: number): number {
	return (px - 5) / 7;
}

function escapeCSVValue(value: string): string {
	const cleanValue = value
		.replace(/"/g, '""')
		.replace(/\r\n/g, " ")
		.replace(/\r/g, " ")
		.replace(/\n/g, " ");
	return `"${cleanValue}"`;
}

type BlockRange = { title: string; startColumn: number; endColumn: number };

// Name row and date row always precede the per-question data rows, so once
// transposed they occupy exactly the first two columns.
const LEADING_COLUMNS = 2;

// Leads with the institution name(s) and answered-at date, then one row per
// question, in survey order.
function buildExportRows(
	items: { step: number; cells: string[] }[],
	nameRow: string[],
	answeredAtRow: string[],
): string[][] {
	return [nameRow, answeredAtRow, ...items.map((item) => item.cells)];
}

// Groups consecutive questions sharing the same survey step (Block A-F, plus
// the trailing consent step) and records which columns that block spans once
// transposed, so its title can be rendered as a single merged, centered
// header cell above them. Block titles come from Questionnaire.meta_data
// .blocks[step], always resolved in German.
function computeBlockRanges(
	items: { step: number }[],
	metaData: unknown,
): BlockRange[] {
	const ranges: (BlockRange & { step: number })[] = [];

	items.forEach((item, index) => {
		const column = LEADING_COLUMNS + index;
		const previous = ranges[ranges.length - 1];
		if (previous && previous.step === item.step) {
			previous.endColumn = column;
			return;
		}
		const { title } = getBlockMeta({ meta_data: metaData }, item.step, "de");
		ranges.push({
			step: item.step,
			title,
			startColumn: column,
			endColumn: column,
		});
	});

	return ranges.map(({ title, startColumn, endColumn }) => ({
		title,
		startColumn,
		endColumn,
	}));
}

// Transposes the question-major row list (one row per question/meta row, one
// column per cultural place) into a place-major grid: one row per cultural
// place, one column per question.
function transposeRows(rows: string[][]): string[][] {
	const rowCount = rows.length;
	const colCount = Math.max(1, ...rows.map((row) => row.length));
	return Array.from({ length: colCount }, (_outer, c) =>
		Array.from({ length: rowCount }, (_inner, r) => rows[r][c] ?? ""),
	);
}

// Prepends a row holding each block's title, left as an empty cell in
// columns that don't belong to any block (the name/date columns). In Excel
// these title cells get merged across their block's column range; CSV has
// no merge concept, so the title there only appears in the range's first
// cell.
function prependBlockHeaderRow(
	aoa: string[][],
	blockRanges: BlockRange[],
): string[][] {
	const columnCount = aoa[0]?.length ?? 0;
	const blockHeaderRow = Array.from({ length: columnCount }, () => "");
	blockRanges.forEach((block) => {
		blockHeaderRow[block.startColumn] = block.title;
	});
	return [blockHeaderRow, ...aoa];
}

function generateExportCSV(aoa: string[][]): string {
	const lines = aoa.map((row) => row.map(escapeCSVValue).join(","));
	const BOM = "﻿";
	return BOM + lines.join("\r\n");
}

function generateExportExcelBuffer(
	aoa: string[][],
	blockRanges: BlockRange[],
): ArrayBuffer {
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const columnCount = Math.max(1, ...aoa.map((row) => row.length));

	// Row 0 is the prepended block-title row; the column-label row (place
	// name, "Beantwortet am", question labels) sits right below it and
	// renders bold throughout.
	const columnHeaderRow = 1;
	for (let c = 0; c < columnCount; c++) {
		const cellAddress = XLSX.utils.encode_cell({ r: columnHeaderRow, c });
		if (ws[cellAddress]) {
			ws[cellAddress].s = { font: { bold: true } };
		}
	}
	aoa.forEach((_, r) => {
		const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
		if (ws[cellAddress]) {
			ws[cellAddress].s = { font: { bold: true } };
		}
	});

	ws["!merges"] = blockRanges
		.filter((block) => block.endColumn > block.startColumn)
		.map((block) => ({
			s: { r: 0, c: block.startColumn },
			e: { r: 0, c: block.endColumn },
		}));
	blockRanges.forEach((block) => {
		const cellAddress = XLSX.utils.encode_cell({ r: 0, c: block.startColumn });
		if (ws[cellAddress]) {
			ws[cellAddress].s = {
				font: { bold: true },
				alignment: { horizontal: "center", vertical: "center" },
			};
		}
	});

	ws["!cols"] = Array.from({ length: columnCount }, () => ({
		wch: pxToExcelWidth(170),
	}));

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Fragebogen");
	return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

function triggerBrowserDownload(
	content: string | ArrayBuffer,
	filename: string,
	mimeType: string,
) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

const sanitizeFilenameBase = (value: string) =>
	value.replace(/[^a-zA-Z0-9-_]+/g, "_");

export async function downloadInstitutionQuestionnaireAnswers({
	institutionId,
	filenameBase,
	format,
}: {
	institutionId: number;
	filenameBase: string;
	format: QuestionnaireDownloadFormat;
}): Promise<
	{ ok: true } | { ok: false; error: QuestionnaireAnswersExportErrorCode }
> {
	const result = await downloadQuestionnaireAnswers(institutionId);
	if (!result.ok) {
		return { ok: false, error: result.error };
	}

	const answeredAtLabel =
		result.data.rows.length > 0
			? formatAnsweredAt(
					new Date(
						Math.max(
							...result.data.rows.map((row) => row.answeredAt.getTime()),
						),
					),
				)
			: "";

	const items = result.data.rows.map((row) => ({
		step: row.step,
		cells: [
			row.questionLabel,
			formatAnswerValue(row.fieldType, row.config, row.value),
		],
	}));

	const rows = buildExportRows(
		items,
		["", result.data.institutionName],
		["Beantwortet am", answeredAtLabel],
	);
	const blockRanges = computeBlockRanges(items, result.data.metaData);

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${timestamp}_${sanitizeFilenameBase(filenameBase)}.${format}`;

	const transposedAoa = transposeRows(rows);
	const aoa = prependBlockHeaderRow(transposedAoa, blockRanges);

	if (format === "csv") {
		triggerBrowserDownload(
			generateExportCSV(aoa),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateExportExcelBuffer(aoa, blockRanges),
			fullFilename,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	}

	return { ok: true };
}

export async function downloadInstitutionQuestionnaireAnswersAll({
	filenameBase,
	format,
}: {
	filenameBase: string;
	format: QuestionnaireDownloadFormat;
}): Promise<
	{ ok: true } | { ok: false; error: QuestionnaireAnswersExportErrorCode }
> {
	const result = await downloadAllQuestionnaireAnswers();
	if (!result.ok) {
		return { ok: false, error: result.error };
	}

	const { metaData, questions, institutions } = result.data;
	const nameRow = ["", ...institutions.map((i) => i.name)];
	const answeredAtRow = [
		"Beantwortet am",
		...institutions.map((i) => formatAnsweredAt(i.answeredAt)),
	];
	const items = questions.map((question) => ({
		step: question.step,
		cells: [
			question.label,
			...institutions.map((institution) =>
				formatAnswerValue(
					question.fieldType,
					question.config,
					institution.answers[question.id],
				),
			),
		],
	}));

	const rows = buildExportRows(items, nameRow, answeredAtRow);
	const blockRanges = computeBlockRanges(items, metaData);

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${timestamp}_${sanitizeFilenameBase(filenameBase)}.${format}`;

	const transposedAoa = transposeRows(rows);
	const aoa = prependBlockHeaderRow(transposedAoa, blockRanges);

	if (format === "csv") {
		triggerBrowserDownload(
			generateExportCSV(aoa),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateExportExcelBuffer(aoa, blockRanges),
			fullFilename,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	}

	return { ok: true };
}
