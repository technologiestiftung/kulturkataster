import * as XLSX from "xlsx-js-style";
import {
	downloadQuestionnaireAnswers,
	downloadAllQuestionnaireAnswers,
	type QuestionnaireAnswersExportErrorCode,
} from "@/server/actions/questionnaires";

export type QuestionnaireDownloadFormat = "csv" | "xlsx";

type QuestionnaireExportRow = {
	Frage: string;
	Antwort: string;
};

function formatAnswerValue(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) return value.map((item) => String(item)).join("; ");
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function formatAnsweredAt(value: Date): string {
	const date = new Date(value);
	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const year = date.getUTCFullYear();
	return `${day}.${month}.${year}`;
}

function createTextWidthMeasurer(): (text: string) => number {
	const ctx =
		typeof document === "undefined"
			? null
			: document.createElement("canvas").getContext("2d");
	if (!ctx) return (text) => text.length;
	ctx.font = "11pt Calibri, Arial, sans-serif";
	const digitWidthPx = ctx.measureText("0").width || 1;
	return (text) => ctx.measureText(text).width / digitWidthPx;
}

function escapeCSVValue(value: string): string {
	const cleanValue = value
		.replace(/"/g, '""')
		.replace(/\r\n/g, " ")
		.replace(/\r/g, " ")
		.replace(/\n/g, " ");
	return `"${cleanValue}"`;
}

function generateQuestionnaireCSV(
	rows: QuestionnaireExportRow[],
	answeredAtLabel: string,
): string {
	const lines = [
		"",
		`${escapeCSVValue("Beantwortet am")},${escapeCSVValue(answeredAtLabel)}`,
		"",
		`${escapeCSVValue("Frage")},${escapeCSVValue("Antworten")}`,
		...rows.map(
			(row) => `${escapeCSVValue(row.Frage)},${escapeCSVValue(row.Antwort)}`,
		),
	];
	const BOM = "﻿";
	return BOM + lines.join("\r\n");
}

function generateQuestionnaireExcelBuffer(
	rows: QuestionnaireExportRow[],
	answeredAtLabel: string,
): ArrayBuffer {
	const aoa: string[][] = [
		[],
		["Beantwortet am", answeredAtLabel],
		[],
		["Frage", "Antworten"],
		...rows.map((row) => [row.Frage, row.Antwort]),
	];
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	[
		{ r: 1, c: 0 }, // "Beantwortet am"
		{ r: 3, c: 0 }, // "Frage"
		{ r: 3, c: 1 }, // "Antworten"
	].forEach(({ r, c }) => {
		const cellAddress = XLSX.utils.encode_cell({ r, c });
		if (ws[cellAddress]) {
			ws[cellAddress].s = { font: { bold: true } };
		}
	});
	const measureTextWidth = createTextWidthMeasurer();
	ws["!cols"] = [0, 1].map((colIndex) => ({
		wch: Math.max(
			...aoa.map((row) => measureTextWidth(String(row[colIndex] ?? ""))),
		),
	}));
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Fragebogen");
	return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

function generateQuestionnaireAllCSV(
	headerRow: string[],
	answeredAtRow: string[],
	questionRows: string[][],
): string {
	const lines = [
		"",
		answeredAtRow.map(escapeCSVValue).join(","),
		"",
		headerRow.map(escapeCSVValue).join(","),
		...questionRows.map((row) => row.map(escapeCSVValue).join(",")),
	];
	const BOM = "﻿";
	return BOM + lines.join("\r\n");
}

function generateQuestionnaireAllExcelBuffer(
	headerRow: string[],
	answeredAtRow: string[],
	questionRows: string[][],
): ArrayBuffer {
	const aoa: string[][] = [[], answeredAtRow, [], headerRow, ...questionRows];
	const ws = XLSX.utils.aoa_to_sheet(aoa);
	const columnCount = headerRow.length;
	[1, 3].forEach((r) => {
		for (let c = 0; c < columnCount; c++) {
			const cellAddress = XLSX.utils.encode_cell({ r, c });
			if (ws[cellAddress]) {
				ws[cellAddress].s = { font: { bold: true } };
			}
		}
	});
	const measureTextWidth = createTextWidthMeasurer();
	ws["!cols"] = Array.from({ length: columnCount }, (_, colIndex) => ({
		wch: Math.max(
			...aoa.map((row) => measureTextWidth(String(row[colIndex] ?? ""))),
		),
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

	const rows: QuestionnaireExportRow[] = result.data.rows.map((row) => ({
		Frage: row.questionLabel,
		Antwort: formatAnswerValue(row.value),
	}));

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${timestamp}_${sanitizeFilenameBase(filenameBase)}.${format}`;

	if (format === "csv") {
		triggerBrowserDownload(
			generateQuestionnaireCSV(rows, answeredAtLabel),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateQuestionnaireExcelBuffer(rows, answeredAtLabel),
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

	const { questions, institutions } = result.data;
	const headerRow = [
		"Frage",
		...institutions.map((institution) => institution.name),
	];
	const answeredAtRow = [
		"Beantwortet am",
		...institutions.map((institution) =>
			formatAnsweredAt(institution.answeredAt),
		),
	];
	const questionRows = questions.map((question) => [
		question.label,
		...institutions.map((institution) =>
			formatAnswerValue(institution.answers[question.id]),
		),
	]);

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${timestamp}_${sanitizeFilenameBase(filenameBase)}.${format}`;

	if (format === "csv") {
		triggerBrowserDownload(
			generateQuestionnaireAllCSV(headerRow, answeredAtRow, questionRows),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateQuestionnaireAllExcelBuffer(
				headerRow,
				answeredAtRow,
				questionRows,
			),
			fullFilename,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	}

	return { ok: true };
}
