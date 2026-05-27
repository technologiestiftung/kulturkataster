import { getDownloadReadableFields } from "@/server/actions/permissions";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { Institution } from "@/types";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";
import * as XLSX from "xlsx-js-style";

export type ExportFormat = "csv" | "xlsx" | "xls";

export const DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER = [
	"status",
	"type",
	"id",
	"name",
	"parent_organization",
	"email",
	"phone",
	"website",
	"cultural_area",
	"street",
	"address_suffix",
	"zipcode",
	"city",
	"district",
	"neighbourhood",
	"categories",
	"subcategories",
	"utilization_status",
	"utilization_status_info",
	"utilization_status_internal_notes",
	"protection_status",
	"protection_status_info",
	"protection_status_internal_notes",
	"legal_form",
	"funding_sources",
	"funding_type",
	"owner_name",
	"owner_type",
	"rental_contract_type",
	"rental_contract_end",
	"established_since",
	"established_until",
	"closing_reason",
	"area",
	"number_of_rooms",
	"capacity",
	"shared_use_allowed",
	"shared_use_info",
	"shared_use_equipment",
	"shared_use_audience",
	"shared_use_availability",
	"accessibility",
	"cost",
	"shared_use_contact_person",
	"contact_person_first_name",
	"contact_person_last_name",
	"notes",
	"internal_notes",
	"source",
] as const;

type ExportAudience = "guest" | "internal";
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface DownloadData {
	data: Institution[];
	filename: string;
	format: ExportFormat;
	translateFn?: TranslateFn;
	columnOrder?: string[];
}

type PrepareDataForExportOptions = {
	translateFn?: TranslateFn;
	readablePermissionFields?: Iterable<string>;
	audience?: ExportAudience;
	columnOrder?: string[];
};

type ExportFieldMeta = {
	exportKey: string;
	permissionField: string | null;
};

const EXCEL_NOTICE_ROWS = 2;
const EXCEL_NOTICE_MERGE_END_COLUMN = 3;
const EXCEL_DOWNLOAD_NOTICE_URL =
	"https://www.kulturkataster.berlin/de/download";
const EXCEL_NOTICE_TEXT =
	"Die Daten stammen vom Berliner Kulturkataster. Bitte benennen Sie bei Verwendung das Kulturkataster als Download-Quelle und beachten Sie die rechtlichen Hinweise. www.kulturkataster.berlin Ein Projekt der Kulturraum Berlin gGmbH";

const enumKeyMappings: Record<string, string> = {
	categories: "category",
	subcategories: "category",
	funding_sources: "funding_source",
	status: "institution_status",
};

// Excluded for guest audience only (visible to logged-in users)
const GUEST_RESTRICTED_EXPORT_FIELDS: Set<string> = new Set(["email", "phone"]);

// Excluded for all audiences
const ALWAYS_EXCLUDED_EXPORT_FIELDS: Set<string> = new Set([
	"contact_person_email",
	"contact_person_phone",
	"contact_person_id",
	"created_at",
	"updated_at",
	"groups",
	"import_identifier",
	"users",
]);

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

function humanizeFieldKey(key: string) {
	return key
		.split("_")
		.map((segment) =>
			segment.length > 0
				? segment.charAt(0).toUpperCase() + segment.slice(1)
				: segment,
		)
		.join(" ");
}

function translateColumnName(key: string, translateFn?: TranslateFn): string {
	if (!translateFn) return humanizeFieldKey(key);

	const translationKey = `enumMap.field_names.${key}.label`;
	const translated = translateFn(translationKey);
	return translated !== translationKey ? translated : humanizeFieldKey(key);
}

function translateEnumValue(
	key: string,
	value: string | number,
	translateFn?: TranslateFn,
): string {
	const normalizedValue = String(value).trim();
	if (!translateFn) {
		return normalizedValue;
	}

	try {
		const translationKey = enumKeyMappings[key] ?? key;
		return getFieldOptionLabel(translateFn, translationKey, normalizedValue);
	} catch {
		return normalizedValue;
	}
}

function formatScalarValue(
	exportKey: string,
	value: unknown,
	translateFn?: TranslateFn,
): string {
	if (value === null || value === undefined) return "";
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "boolean") {
		return translateEnumValue(exportKey, value ? "yes" : "no", translateFn);
	}
	if (typeof value === "string" || typeof value === "number") {
		return translateEnumValue(exportKey, value, translateFn);
	}
	return String(value);
}

function extractDisplayValueFromObject(
	item: Record<string, unknown>,
	exportKey: string,
	audience: ExportAudience,
	translateFn?: TranslateFn,
): string {
	if (exportKey === "funding_sources") {
		const sourceName = item.source_name;
		const description = item.description;
		if (typeof sourceName === "string" && sourceName.trim().length > 0) {
			const translatedSourceName = translateEnumValue(
				exportKey,
				sourceName,
				translateFn,
			);
			if (typeof description === "string" && description.trim().length > 0) {
				return `${translatedSourceName}: ${description}`;
			}
			return translatedSourceName;
		}
	}

	const preferredKeysByField: Record<string, string[]> = {
		categories: ["key", "name", "id"],
		subcategories: ["key", "name", "id"],
		tags: ["name", "key", "id"],
		groups: ["name", "key", "id"],
		users: ["name", "key", "id"],
		funding_sources: ["source_name", "name", "key", "id"],
	};

	const preferredKeys = preferredKeysByField[exportKey] ?? [
		"name",
		"key",
		"id",
	];
	for (const preferredKey of preferredKeys) {
		const rawValue = item[preferredKey];
		if (typeof rawValue === "string" || typeof rawValue === "number") {
			return translateEnumValue(exportKey, rawValue, translateFn);
		}
	}

	if (audience === "guest") {
		return "";
	}

	return JSON.stringify(item);
}

function formatArrayField(
	exportKey: string,
	value: unknown[],
	audience: ExportAudience,
	translateFn?: TranslateFn,
): Record<string, string> {
	if (value.length === 0) return { [exportKey]: "" };

	const firstItem = value[0];
	if (typeof firstItem === "string" || typeof firstItem === "number") {
		return {
			[exportKey]: value
				.map((item) =>
					translateEnumValue(exportKey, item as string | number, translateFn),
				)
				.join("; "),
		};
	}

	if (!isObjectRecord(firstItem)) {
		return { [exportKey]: value.map((item) => String(item)).join("; ") };
	}

	if (exportKey === "categories") {
		const parentCategories = value.filter(
			(item) =>
				isObjectRecord(item) &&
				(item.parent_category_id === null ||
					typeof item.parent_category_id === "undefined"),
		);
		const childCategories = value.filter(
			(item) =>
				isObjectRecord(item) && typeof item.parent_category_id === "number",
		);
		return {
			categories: parentCategories
				.map((item) =>
					extractDisplayValueFromObject(
						item as Record<string, unknown>,
						"categories",
						audience,
						translateFn,
					),
				)
				.filter(Boolean)
				.join("; "),
			subcategories: childCategories
				.map((item) =>
					extractDisplayValueFromObject(
						item as Record<string, unknown>,
						"subcategories",
						audience,
						translateFn,
					),
				)
				.filter(Boolean)
				.join("; "),
		};
	}

	return {
		[exportKey]: value
			.map((item) =>
				isObjectRecord(item)
					? extractDisplayValueFromObject(
							item,
							exportKey,
							audience,
							translateFn,
						)
					: String(item),
			)
			.filter(Boolean)
			.join("; "),
	};
}

function getExportFieldMeta(path: string[]): ExportFieldMeta | null {
	const [root, ...rest] = path;
	if (!root) return null;

	if (root === "address") {
		const leaf = rest[rest.length - 1];
		if (!leaf) return null;
		return {
			exportKey: leaf,
			permissionField: normalizeInstitutionPermissionField("address"),
		};
	}

	if (root === "contact_person") {
		const leaf = rest[rest.length - 1];
		if (!leaf) return null;
		return {
			exportKey: `contact_person_${leaf}`,
			permissionField: normalizeInstitutionPermissionField("contact_person"),
		};
	}

	return {
		exportKey: root,
		permissionField: normalizeInstitutionPermissionField(root),
	};
}

function isExportFieldAllowed(
	meta: ExportFieldMeta,
	readablePermissionFields: Set<string> | null,
	audience: ExportAudience,
): boolean {
	if (!meta.permissionField) return false;
	if (ALWAYS_EXCLUDED_EXPORT_FIELDS.has(meta.exportKey)) return false;
	if (
		audience === "guest" &&
		GUEST_RESTRICTED_EXPORT_FIELDS.has(meta.exportKey)
	) {
		return false;
	}
	if (!readablePermissionFields) return true;
	return readablePermissionFields.has(meta.permissionField);
}

function collectExportValues(
	value: unknown,
	path: string[],
	output: Map<string, string>,
	options: {
		translateFn?: TranslateFn;
		readablePermissionFields: Set<string> | null;
		audience: ExportAudience;
	},
) {
	if (value === null || typeof value === "undefined") return;

	if (
		isObjectRecord(value) &&
		(path[0] === "address" || path[0] === "contact_person")
	) {
		const isAddressRoot = path[0] === "address" && path.length === 1;
		Object.entries(value).forEach(([childKey, childValue]) => {
			// street_number is merged into the street field
			if (isAddressRoot && childKey === "street_number") return;
			const effectiveValue =
				isAddressRoot && childKey === "street"
					? [childValue, value["street_number"]].filter(Boolean).join(" ")
					: childValue;
			collectExportValues(effectiveValue, [...path, childKey], output, options);
		});
		return;
	}

	const meta = getExportFieldMeta(path);
	if (!meta) return;

	if (Array.isArray(value)) {
		if (
			!isExportFieldAllowed(
				meta,
				options.readablePermissionFields,
				options.audience,
			)
		) {
			return;
		}
		const entries = formatArrayField(
			meta.exportKey,
			value,
			options.audience,
			options.translateFn,
		);
		Object.entries(entries).forEach(([key, formattedValue]) => {
			if (ALWAYS_EXCLUDED_EXPORT_FIELDS.has(key)) return;
			if (
				options.audience === "guest" &&
				GUEST_RESTRICTED_EXPORT_FIELDS.has(key)
			) {
				return;
			}
			output.set(key, formattedValue);
		});
		return;
	}

	if (isObjectRecord(value)) {
		if (
			!isExportFieldAllowed(
				meta,
				options.readablePermissionFields,
				options.audience,
			)
		) {
			return;
		}
		output.set(
			meta.exportKey,
			extractDisplayValueFromObject(
				value,
				meta.exportKey,
				options.audience,
				options.translateFn,
			),
		);
		return;
	}

	if (
		!isExportFieldAllowed(
			meta,
			options.readablePermissionFields,
			options.audience,
		)
	) {
		return;
	}
	output.set(
		meta.exportKey,
		formatScalarValue(meta.exportKey, value, options.translateFn),
	);
}

export function prepareDataForExport(
	institutions: Institution[],
	options: PrepareDataForExportOptions = {},
): Record<string, string>[] {
	const readablePermissionFields = options.readablePermissionFields
		? new Set(
				Array.from(options.readablePermissionFields)
					.map((field) => normalizeInstitutionPermissionField(field))
					.filter((field): field is string => Boolean(field)),
			)
		: null;
	const audience = options.audience ?? "internal";
	const columnOrder: string[] = [];
	const rows = institutions
		.slice()
		.sort((a, b) => a.id - b.id)
		.map((institution) => {
			const output = new Map<string, string>();
			Object.entries(institution).forEach(([key, value]) => {
				collectExportValues(value, [key], output, {
					translateFn: options.translateFn,
					readablePermissionFields,
					audience,
				});
			});
			output.forEach((_, key) => {
				if (!columnOrder.includes(key)) {
					columnOrder.push(key);
				}
			});
			return output;
		});

	const preferredOrder = options.columnOrder ?? [];
	const orderedColumns =
		preferredOrder.length > 0
			? [
					...preferredOrder.filter((key) => columnOrder.includes(key)),
					...columnOrder.filter((key) => !preferredOrder.includes(key)),
				]
			: columnOrder;

	return rows.map((row) => {
		const flattened: Record<string, string> = {};
		orderedColumns.forEach((fieldKey) => {
			flattened[translateColumnName(fieldKey, options.translateFn)] =
				row.get(fieldKey) ?? "";
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

function applyExcelNotice(ws: XLSX.WorkSheet) {
	ws["!merges"] = [
		...(ws["!merges"] ?? []),
		{
			s: { r: 0, c: 0 },
			e: { r: 0, c: EXCEL_NOTICE_MERGE_END_COLUMN },
		},
	];

	ws.A1 = {
		t: "s",
		v: EXCEL_NOTICE_TEXT,
		l: {
			Target: EXCEL_DOWNLOAD_NOTICE_URL,
			Tooltip: EXCEL_DOWNLOAD_NOTICE_URL,
		},
		s: {
			font: {
				name: "Arial",
				sz: 12,
				bold: true,
				color: { rgb: "000000" },
			},
			alignment: {
				horizontal: "left",
				vertical: "top",
				wrapText: true,
			},
		},
	};

	ws["!rows"] = [{ hpt: 44 }, { hpt: 8 }];
}

function applyExcelHeaderStyle(ws: XLSX.WorkSheet, headers: string[]) {
	headers.forEach((_, colIndex) => {
		const cellAddress = XLSX.utils.encode_cell({
			r: EXCEL_NOTICE_ROWS,
			c: colIndex,
		});
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

function applyExcelColumnWidths(
	ws: XLSX.WorkSheet,
	data: Record<string, string>[],
) {
	if (data.length === 0) {
		ws["!cols"] = [{ wch: 60 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
		return;
	}

	const headers = Object.keys(data[0]);
	ws["!cols"] = headers.map((header, colIndex) => {
		const maxContentLength = Math.max(
			header.length,
			...data.map((row) => String(row[header] ?? "").length),
		);
		const minimumWidth = colIndex === 0 ? 30 : 14;
		const maximumWidth = colIndex === 0 ? 42 : 32;
		return {
			wch: Math.min(Math.max(maxContentLength + 2, minimumWidth), maximumWidth),
		};
	});
}

export function generateExcelBuffer(
	data: Record<string, string>[],
	format: "xlsx" | "xls",
): ArrayBuffer {
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.aoa_to_sheet([]);
	applyExcelNotice(ws);

	if (data.length > 0) {
		XLSX.utils.sheet_add_json(ws, data, {
			origin: `A${EXCEL_NOTICE_ROWS + 1}`,
		});
		applyExcelHeaderStyle(ws, Object.keys(data[0]));
	}
	applyExcelColumnWidths(ws, data);

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
	columnOrder,
}: DownloadData) {
	const { readableFields, audience } =
		await getDownloadReadableFields("institution");
	const preparedData = prepareDataForExport(data, {
		translateFn,
		readablePermissionFields: readableFields,
		audience,
		columnOrder,
	});

	const timestamp = new Date().toISOString().split("T")[0];
	const fullFilename = `${filename}_${timestamp}.${format}`;

	switch (format) {
		case "csv": {
			const csvContent = generateCSV(preparedData);
			downloadFile(csvContent, fullFilename, "text/csv;charset=utf-8;");
			break;
		}
		case "xlsx": {
			const xlsxBuffer = generateExcelBuffer(preparedData, "xlsx");
			downloadBinaryFile(
				xlsxBuffer,
				fullFilename,
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);
			break;
		}
		case "xls": {
			const xlsBuffer = generateExcelBuffer(preparedData, "xls");
			downloadBinaryFile(xlsBuffer, fullFilename, "application/vnd.ms-excel");
			break;
		}
		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}
