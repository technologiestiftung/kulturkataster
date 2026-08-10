import * as XLSX from "xlsx-js-style";
import {
	getInstitutionSurveyAnswersForExport,
	type SurveyExportErrorCode,
} from "@/server/actions/surveys";

export type SurveyDownloadFormat = "csv" | "xlsx";

type SurveyExportRow = {
	Frage: string;
	Antwort: string;
	Name: string;
	"E-Mail": string;
	"Beantwortet am": string;
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

function escapeCSVValue(value: string): string {
	const cleanValue = value
		.replace(/"/g, '""')
		.replace(/\r\n/g, " ")
		.replace(/\r/g, " ")
		.replace(/\n/g, " ");
	return `"${cleanValue}"`;
}

function generateSurveyCSV(rows: SurveyExportRow[]): string {
	if (rows.length === 0) return "";
	const headers = Object.keys(rows[0]) as (keyof SurveyExportRow)[];
	const csvHeaders = headers.map((header) => escapeCSVValue(header)).join(",");
	const csvRows = rows.map((row) =>
		headers.map((header) => escapeCSVValue(row[header])).join(","),
	);
	const BOM = "﻿";
	return BOM + [csvHeaders, ...csvRows].join("\r\n");
}

function generateSurveyExcelBuffer(rows: SurveyExportRow[]): ArrayBuffer {
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(rows);
	XLSX.utils.book_append_sheet(wb, ws, "Umfrage");
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

export async function downloadInstitutionSurveyAnswers({
	institutionId,
	filenameBase,
	format,
}: {
	institutionId: number;
	filenameBase: string;
	format: SurveyDownloadFormat;
}): Promise<{ ok: true } | { ok: false; error: SurveyExportErrorCode }> {
	const result = await getInstitutionSurveyAnswersForExport(institutionId);
	if (!result.ok) {
		return { ok: false, error: result.error };
	}

	const rows: SurveyExportRow[] = result.data.rows.map((row) => ({
		Frage: row.questionLabel,
		Antwort: formatAnswerValue(row.value),
		Name: row.submitterName ?? "",
		"E-Mail": row.submitterEmail ?? "",
		"Beantwortet am": formatAnsweredAt(row.answeredAt),
	}));

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${sanitizeFilenameBase(filenameBase)}_${timestamp}.${format}`;

	if (format === "csv") {
		triggerBrowserDownload(
			generateSurveyCSV(rows),
			fullFilename,
			"text/csv;charset=utf-8;",
		);
	} else {
		triggerBrowserDownload(
			generateSurveyExcelBuffer(rows),
			fullFilename,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	}

	return { ok: true };
}
