import { getGuestReadableFields } from "@/server/actions/permissions";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { Institution } from "@/types";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";
import * as XLSX from "xlsx-js-style";

export type ExportFormat = "csv" | "xlsx" | "xls";
type ExportAudience = "guest" | "internal";
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface DownloadData {
	data: Institution[];
	filename: string;
	format: ExportFormat;
	translateFn?: TranslateFn;
}

type PrepareDataForExportOptions = {
	translateFn?: TranslateFn;
	readablePermissionFields?: Iterable<string>;
	audience?: ExportAudience;
};

type ExportFieldMeta = {
	exportKey: string;
	permissionField: string | null;
};

const enumKeyMappings: Record<string, string> = {
	categories: "category",
	subcategories: "category",
	funding_sources: "funding_source",
	status: "institution_status",
};

const GUEST_RESTRICTED_EXPORT_FIELDS = new Set([
	"email",
	"phone",
	"contact_person_email",
	"contact_person_phone",
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

	const translationKey = `field_names.${key}.label`;
	const translated = translateFn(translationKey);
	return translated !== translationKey ? translated : humanizeFieldKey(key);
}

function translateEnumValue(
	key: string,
	value: string | number,
	translateFn?: TranslateFn,
): string {
	if (!translateFn) {
		return value.toString();
	}

	try {
		const translationKey = enumKeyMappings[key] ?? key;
		return getFieldOptionLabel(translateFn, translationKey, String(value));
	} catch {
		return value.toString();
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
		return translateEnumValue(
			exportKey,
			value ? "yes" : "no",
			translateFn,
		);
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
			if (typeof description === "string" && description.trim().length > 0) {
				return `${sourceName}: ${description}`;
			}
			return sourceName;
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
		Object.entries(value).forEach(([childKey, childValue]) =>
			collectExportValues(childValue, [...path, childKey], output, options),
		);
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

	return rows.map((row) => {
		const flattened: Record<string, string> = {};
		columnOrder.forEach((fieldKey) => {
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
	const guestReadableFields = await getGuestReadableFields("institution");
	const preparedData = prepareDataForExport(data, {
		translateFn,
		readablePermissionFields: guestReadableFields,
		audience: "guest",
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
