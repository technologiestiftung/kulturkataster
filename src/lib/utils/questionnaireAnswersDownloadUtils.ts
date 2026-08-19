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

function formatScalarValue(config: QuestionConfigShape, rawValue: unknown): string {
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

type AoaRowKind = "blank" | "name" | "date" | "blockTitle" | "data";
type AoaRow = { kind: AoaRowKind; cells: string[] };

// Leads with the institution name(s) and answered-at date, then groups
// question rows into their survey block (Block A-F, plus the trailing
// consent step), inserting a block-title row whenever the step changes.
// Block titles come from Questionnaire.meta_data.blocks[step], always
// resolved in German.
function buildExportRows(
	items: { step: number; cells: string[] }[],
	metaData: unknown,
	nameRow: string[],
	answeredAtRow: string[],
): AoaRow[] {
	const rows: AoaRow[] = [
		{ kind: "name", cells: nameRow },
		{ kind: "date", cells: answeredAtRow },
	];

	let currentStep: number | null = null;
	items.forEach((item) => {
		if (item.step !== currentStep) {
			rows.push({ kind: "blank", cells: [] });
			const { title } = getBlockMeta({ meta_data: metaData }, item.step, "de");
			rows.push({ kind: "blockTitle", cells: [title] });
			currentStep = item.step;
		}
		rows.push({ kind: "data", cells: item.cells });
	});

	return rows;
}

function generateExportCSV(rows: AoaRow[]): string {
	const lines = rows.map((row) => row.cells.map(escapeCSVValue).join(","));
	const BOM = "﻿";
	return BOM + lines.join("\r\n");
}

function generateExportExcelBuffer(rows: AoaRow[]): ArrayBuffer {
	const aoa = rows.map((row) => row.cells);
	const ws = XLSX.utils.aoa_to_sheet(aoa);

	rows.forEach((row, r) => {
		if (row.kind === "date" || row.kind === "blockTitle") {
			const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
			if (ws[cellAddress]) {
				ws[cellAddress].s = { font: { bold: true } };
			}
		}
		if (row.kind === "name") {
			row.cells.forEach((_, c) => {
				const cellAddress = XLSX.utils.encode_cell({ r, c });
				if (ws[cellAddress]) {
					ws[cellAddress].s = { font: { bold: true } };
				}
			});
		}
	});

	const columnCount = Math.max(1, ...aoa.map((row) => row.length));
	ws["!cols"] = Array.from({ length: columnCount }, (_, colIndex) => ({
		wch: pxToExcelWidth(colIndex === 0 ? 780 : 170),
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
		result.data.metaData,
		[result.data.institutionName],
		["Beantwortet am", answeredAtLabel],
	);

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${timestamp}_${sanitizeFilenameBase(filenameBase)}.${format}`;

	if (format === "csv") {
		triggerBrowserDownload(
			generateExportCSV(rows),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateExportExcelBuffer(rows),
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

	const rows = buildExportRows(items, metaData, nameRow, answeredAtRow);

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${timestamp}_${sanitizeFilenameBase(filenameBase)}.${format}`;

	if (format === "csv") {
		triggerBrowserDownload(
			generateExportCSV(rows),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateExportExcelBuffer(rows),
			fullFilename,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	}

	return { ok: true };
}
