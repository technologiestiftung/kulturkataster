import { Institution } from "@/types";
import * as XLSX from "xlsx-js-style";

export type ExportFormat = "csv" | "xlsx" | "xls";

interface DownloadData {
	data: Institution[];
	filename: string;
	format: ExportFormat;
	translateFn?: (key: string, options?: Record<string, unknown>) => string;
}

function translateEnumValue(
	key: string,
	value: string | number,
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): string {
	if (!translateFn) {
		return value.toString();
	}

	const enumKeyMappings: Record<string, string> = {
		district_id: "district_id",
		categories: "category",
		subcategories: "subcategory",
		funding_sources: "funding_source",
		funding_type: "funding_type",
		status: "institution_status",
		utilization_status: "utilization_status",
	};

	const enumType = enumKeyMappings[key];
	if (enumType) {
		try {
			const translationKey = `${enumType}.${value}`;
			const translated = translateFn(translationKey);

			if (translated !== translationKey) {
				return translated;
			}
		} catch {}
	}

	return value.toString();
}

function handleNullValue(key: string): Record<string, string> {
	return { [key]: "" };
}

function handleArrayValue(
	value: unknown[],
	key: string,
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): Record<string, string> {
	if (value.length === 0) {
		return { [key]: "" };
	}

	const firstItem = value[0];
	if (typeof firstItem === "string" || typeof firstItem === "number") {
		const translatedValues = value.map((item) =>
			translateEnumValue(key, item as string | number, translateFn),
		);
		return { [key]: translatedValues.join("; ") };
	}

	if (typeof firstItem === "object" && firstItem !== null) {
		const names = value.map((item) => {
			if (item && typeof item === "object") {
				const obj = item as Record<string, unknown>;
				const extractedValue = obj.name || obj.key;

				if (extractedValue) {
					return translateEnumValue(key, String(extractedValue), translateFn);
				}

				return JSON.stringify(item);
			}
			return translateEnumValue(key, String(item), translateFn);
		});
		return { [key]: names.join("; ") };
	}

	return { [key]: value.join("; ") };
}

// Handle object values for export
function handleObjectValue(
	value: Record<string, unknown>,
	key: string,
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): Record<string, string> {
	// Try to extract meaningful properties first
	if (value.name) {
		const translatedValue = translateEnumValue(
			key,
			String(value.name),
			translateFn,
		);
		return { [key]: translatedValue };
	}
	if (value.key) {
		const translatedValue = translateEnumValue(
			key,
			String(value.key),
			translateFn,
		);
		return { [key]: translatedValue };
	}

	// Fallback to JSON stringification
	return { [key]: JSON.stringify(value) };
}

function flattenProperty(
	value: unknown,
	key: string,
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): Record<string, string> {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return handleNullValue(key);
	}

	if (Array.isArray(value)) {
		return handleArrayValue(value, key, translateFn);
	}

	if (typeof value === "object" && value !== null) {
		return handleObjectValue(
			value as Record<string, unknown>,
			key,
			translateFn,
		);
	}

	const translatedValue = translateEnumValue(
		key,
		value as string | number,
		translateFn,
	);
	return { [key]: translatedValue };
}

const COLUMN_ORDER = [
	"name",
	"status",
	"email",
	"phone",
	"website",
	"street",
	"street_number",
	"zip_code",
	"city_id",
	"district_id",
	"categories",
	"subcategories",
	"tags",
	"description",
	"capacity",
	"rooms_count",
	"established_since",
	"utilization_status",
	"shared_use_allowed",
	"funding_type",
	"funding_sources",
	"support_type",
	"parent_organizations",
];

const EXCLUDED_FIELDS = [
	"id",
	"updated_at",
	"city_id",
	"created_at",
	"cultural_area_id",
];

export function prepareDataForExport(
	institutions: Institution[],
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): Record<string, string>[] {
	return institutions
		.sort((a, b) => a.id - b.id)
		.map((institution) => {
			const flattened: Record<string, string> = {};

			const tempFlattened: Record<string, string> = {};
			Object.entries(institution).forEach(([key, value]) => {
				if (EXCLUDED_FIELDS.includes(key)) {
					return;
				}

				const flattenedProp = flattenProperty(value, key, translateFn);
				Object.assign(tempFlattened, flattenedProp);
			});

			COLUMN_ORDER.forEach((columnKey) => {
				if (tempFlattened.hasOwnProperty(columnKey)) {
					let translatedColumnName = columnKey;
					if (translateFn) {
						const translationKey = `field_names.${columnKey}`;
						const translation = translateFn(translationKey);
						if (translation !== translationKey) {
							translatedColumnName = translation;
						}
					}
					flattened[translatedColumnName] = tempFlattened[columnKey];
				}
			});

			Object.entries(tempFlattened).forEach(([key, value]) => {
				let translatedColumnName = key;
				if (translateFn) {
					const translationKey = `field_names.${key}`;
					const translation = translateFn(translationKey);
					if (translation !== translationKey) {
						translatedColumnName = translation;
					}
				}
				if (!flattened.hasOwnProperty(translatedColumnName)) {
					flattened[translatedColumnName] = value;
				}
			});

			return flattened;
		});
}

function generateCSV(data: Record<string, string>[]): string {
	if (data.length === 0) return "";

	const headers = Object.keys(data[0]);

	const escapeCSVValue = (value: string | undefined): string => {
		if (!value) return '""';
		const stringValue = String(value);

		const cleanValue = stringValue
			.replace(/"/g, '""')
			.replace(/\r\n/g, " ")
			.replace(/\r/g, " ")
			.replace(/\n/g, " ");

		return `"${cleanValue}"`;
	};

	const csvHeaders = headers.map(escapeCSVValue).join(",");
	const csvRows = data.map((row) =>
		headers.map((header) => escapeCSVValue(row[header])).join(","),
	);

	const BOM = "\uFEFF";
	return BOM + [csvHeaders, ...csvRows].join("\r\n");
}

function generateExcelBuffer(
	data: Record<string, string>[],
	format: "xlsx" | "xls",
): ArrayBuffer {
	if (data.length === 0) {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet([]);
		XLSX.utils.book_append_sheet(wb, ws, "Kulturorte");
		return XLSX.write(wb, { bookType: format, type: "array" });
	}

	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(data);
	if (data.length > 0) {
		const headers = Object.keys(data[0]);
		headers.forEach((_, colIndex) => {
			const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
			if (ws[cellAddress]) {
				ws[cellAddress].s = {
					font: {
						name: "Arial",
						sz: 11,
						bold: true,
					},
					fill: {
						patternType: "solid",
						fgColor: { rgb: "FFFFFF" },
					},
					alignment: {
						horizontal: "center",
						vertical: "center",
					},
					border: {
						bottom: { style: "thin", color: { rgb: "000000" } },
					},
				};
			}
		});
	}

	XLSX.utils.book_append_sheet(wb, ws, "Kulturorte");
	return XLSX.write(wb, { bookType: format, type: "array" });
}

function downloadFile(content: string, filename: string, mimeType: string) {
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

function downloadBinaryFile(
	content: ArrayBuffer,
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

export async function downloadInstitutions({
	data,
	filename,
	format,
	translateFn,
}: DownloadData) {
	const preparedData = prepareDataForExport(data, translateFn);

	const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	const fullFilename = `${filename}_${timestamp}.${format}`;

	switch (format) {
		case "csv":
			const csvContent = generateCSV(preparedData);
			downloadFile(csvContent, fullFilename, "text/csv;charset=utf-8;");
			break;

		case "xlsx":
			const xlsxBuffer = generateExcelBuffer(preparedData, "xlsx");
			downloadBinaryFile(
				xlsxBuffer,
				fullFilename,
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);
			break;

		case "xls":
			const xlsBuffer = generateExcelBuffer(preparedData, "xls");
			downloadBinaryFile(xlsBuffer, fullFilename, "application/vnd.ms-excel");
			break;

		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}
