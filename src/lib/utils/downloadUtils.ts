import { InstitutionProperties } from "@/types";
import * as XLSX from "xlsx";

export type ExportFormat = "csv" | "xlsx" | "xls";

interface DownloadData {
	data: InstitutionProperties[];
	filename: string;
	format: ExportFormat;
	translateFn?: (key: string, options?: Record<string, unknown>) => string;
}

// Translation lookup function for enum values
function translateEnumValue(
	key: string,
	value: string | number,
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): string {
	if (!translateFn) {
		return value.toString();
	}

	// Handle special cases for different property types
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
			// Try to translate using i18n key format
			const translationKey = `${enumType}.${value}`;
			const translated = translateFn(translationKey);

			// If translation key is returned as-is, it means no translation was found
			if (translated !== translationKey) {
				return translated;
			}
		} catch {
			// Fallback to original value if translation fails
		}
	}

	return value.toString();
}

// Handle null/undefined values
function handleNullValue(key: string): Record<string, string> {
	return { [key]: "" };
}

// Handle array values for export
function handleArrayValue(
	value: unknown[],
	key: string,
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): Record<string, string> {
	if (value.length === 0) {
		return { [key]: "" };
	}

	// Handle primitive arrays (strings, numbers)
	const firstItem = value[0];
	if (typeof firstItem === "string" || typeof firstItem === "number") {
		const translatedValues = value.map((item) =>
			translateEnumValue(key, item as string | number, translateFn),
		);
		return { [key]: translatedValues.join("; ") };
	}

	// Handle object arrays - extract meaningful properties
	if (typeof firstItem === "object" && firstItem !== null) {
		const names = value.map((item) => {
			if (item && typeof item === "object") {
				const obj = item as Record<string, unknown>;
				const extractedValue = obj.name || obj.key;

				// Try to translate if it's a known enum value
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

	// Handle arrays
	if (Array.isArray(value)) {
		return handleArrayValue(value, key, translateFn);
	}

	// Handle objects
	if (typeof value === "object" && value !== null) {
		return handleObjectValue(
			value as Record<string, unknown>,
			key,
			translateFn,
		);
	}

	// Handle primitives - apply translation for enum values
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

const EXCLUDED_FIELDS = ["id", "updated_at"];

// Convert institution data to flat records for export with ordered columns
export function prepareDataForExport(
	institutions: InstitutionProperties[],
	translateFn?: (key: string, options?: Record<string, unknown>) => string,
): Record<string, string>[] {
	return institutions
		.sort((a, b) => a.id - b.id) // Sort by ID
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
					flattened[columnKey] = tempFlattened[columnKey];
				}
			});

			Object.entries(tempFlattened).forEach(([key, value]) => {
				if (!flattened.hasOwnProperty(key)) {
					flattened[key] = value;
				}
			});

			return flattened;
		});
}

// Generate CSV content
function generateCSV(data: Record<string, string>[]): string {
	if (data.length === 0) return "";

	const headers = Object.keys(data[0]);
	const csvHeaders = headers.join(",");

	const csvRows = data.map((row) =>
		headers
			.map((header) => {
				const value = row[header];
				// Escape commas and quotes in CSV
				if (
					typeof value === "string" &&
					(value.includes(",") || value.includes('"'))
				) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			})
			.join(","),
	);

	return [csvHeaders, ...csvRows].join("\n");
}

// Generate proper Excel file using xlsx library
function generateExcelBuffer(
	data: Record<string, string>[],
	format: "xlsx" | "xls",
): ArrayBuffer {
	if (data.length === 0) {
		// Create empty workbook
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.json_to_sheet([]);
		XLSX.utils.book_append_sheet(wb, ws, "Institutions");
		return XLSX.write(wb, { bookType: format, type: "array" });
	}

	// Create workbook and worksheet
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(data);

	// Add worksheet to workbook
	XLSX.utils.book_append_sheet(wb, ws, "Institutions");

	// Generate file
	return XLSX.write(wb, { bookType: format, type: "array" });
}

// Trigger file download for text content
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

// Trigger file download for binary content
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

// Main download function
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
