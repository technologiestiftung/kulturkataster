import { getDownloadReadableFields } from "@/server/actions/permissions";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { Institution } from "@/types";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";
import {
	getInstitutionExportColumnOrder,
	type ExportAudience,
} from "@/lib/utils/institutionExportPolicy";
import * as XLSX from "xlsx-js-style";

export type ExportFormat = "csv" | "xlsx" | "xls";
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
	getReadablePermissionFields?: (institution: Institution) => Iterable<string>;
	getAudience?: (institution: Institution) => ExportAudience;
	audience?: ExportAudience;
	columnOrder?: string[];
};

type ExportFieldMeta = {
	exportKey: string;
	permissionField: string;
};

const EXCEL_NOTICE_ROWS = 5;
const EXCEL_NOTICE_MERGE_END_COLUMN = 3;
const EXCEL_NOTICE_DEFAULT_ROWS = [
	"Die Daten stammen vom Berliner Kulturkataster.",
	"Bitte benennen Sie bei Verwendung das Kulturkataster als Download-Quelle und beachten Sie die rechtlichen Hinweise.",
	"www.kulturkataster.berlin",
	"Ein Projekt der Kulturraum Berlin gGmbH",
] as const;
const EXCEL_LEGAL_NOTICE_URL = "https://kulturkataster.berlin/de/download";
const EXCEL_HYPERLINK_FONT_COLOR = "0563C1";

const enumKeyMappings: Record<string, string> = {
	categories: "category",
	subcategories: "category",
	funding_sources: "funding_source",
	status: "institution_status",
};

const TRANSLATED_VALUE_EXPORT_KEYS = new Set([
	"categories",
	"subcategories",
	"funding_sources",
	"funding_type",
	"owner_type",
	"protection_status",
	"rental_contract_type",
	"shared_use_allowed",
	"status",
	"utilization_status",
]);

const URL_EXPORT_KEYS = new Set(["website"]);

const shouldTranslateExportValue = (exportKey: string) =>
	TRANSLATED_VALUE_EXPORT_KEYS.has(exportKey);

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" &&
	value !== null &&
	!Array.isArray(value) &&
	!(value instanceof Date);

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

export function translateColumnName(
	key: string,
	translateFn?: TranslateFn,
): string {
	if (!translateFn) return humanizeFieldKey(key);

	const translationKey = `enumMap.field_names.${key}.label`;
	const translated = translateFn(translationKey);
	return translated !== translationKey ? translated : humanizeFieldKey(key);
}

export function translateEnumValue(
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

function formatDateValue(value: Date): string {
	const day = String(value.getUTCDate()).padStart(2, "0");
	const month = String(value.getUTCMonth() + 1).padStart(2, "0");
	const year = value.getUTCFullYear();
	return `${day}.${month}.${year}`;
}

function parseIsoDateValue(value: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value)) {
		return null;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeUrlValue(value: string): string {
	const trimmedValue = value.trim();
	if (!trimmedValue) return "";
	if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue)) return trimmedValue;
	if (trimmedValue.startsWith("//")) return `https:${trimmedValue}`;
	return `https://${trimmedValue.replace(/^\/+/, "")}`;
}

function formatScalarValue(
	exportKey: string,
	value: unknown,
	translateFn?: TranslateFn,
): string {
	if (value === null || value === undefined) return "";
	if (value instanceof Date) return formatDateValue(value);
	if (typeof value === "boolean") {
		return translateEnumValue(exportKey, value ? "yes" : "no", translateFn);
	}
	if (typeof value === "string") {
		if (URL_EXPORT_KEYS.has(exportKey)) {
			return normalizeUrlValue(value);
		}
		const date = parseIsoDateValue(value);
		return date
			? formatDateValue(date)
			: shouldTranslateExportValue(exportKey)
				? translateEnumValue(exportKey, value, translateFn)
				: value;
	}
	if (typeof value === "number") {
		return String(value);
	}
	return String(value);
}

function extractDisplayValueFromObject(
	item: Record<string, unknown>,
	exportKey: string,
	audience: ExportAudience,
	translateFn?: TranslateFn,
): string {
	if (exportKey === "users") {
		const firstName =
			typeof item.first_name === "string" ? item.first_name : "";
		const lastName = typeof item.last_name === "string" ? item.last_name : "";
		const fullName = [firstName, lastName]
			.map((part) => part.trim())
			.filter(Boolean)
			.join(" ");
		if (fullName) return fullName;

		const email = item.email;
		if (typeof email === "string" && email.trim().length > 0) {
			return email;
		}
	}

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
		users: ["name", "email", "key"],
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
			return shouldTranslateExportValue(exportKey)
				? translateEnumValue(exportKey, rawValue, translateFn)
				: String(rawValue);
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
				.map((item) => {
					const _value = item as string | number;
					return shouldTranslateExportValue(exportKey)
						? translateEnumValue(exportKey, _value, translateFn)
						: String(_value);
				})
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
		const permissionField = normalizeInstitutionPermissionField(
			`address.${leaf}`,
		);
		if (!permissionField) return null;
		return {
			exportKey: leaf,
			permissionField,
		};
	}

	if (root === "contact_person") {
		const leaf = rest[rest.length - 1];
		if (!leaf) return null;
		const permissionField = normalizeInstitutionPermissionField(
			`contact_person.${leaf}`,
		);
		if (!permissionField) return null;
		return {
			exportKey: `contact_person_${leaf}`,
			permissionField,
		};
	}

	const permissionField = normalizeInstitutionPermissionField(root);
	if (!permissionField) return null;
	return {
		exportKey: root,
		permissionField,
	};
}

function isExportFieldAllowed(
	meta: ExportFieldMeta,
	readablePermissionFields: Set<string> | null,
): boolean {
	if (!readablePermissionFields) return true;
	return readablePermissionFields.has(meta.permissionField);
}

function isExportKeyAllowed(
	exportKey: string,
	readablePermissionFields: Set<string> | null,
): boolean {
	const permissionField = normalizeInstitutionPermissionField(exportKey);
	if (!permissionField) return false;
	if (!readablePermissionFields) return true;
	return readablePermissionFields.has(permissionField);
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
		if (!isExportFieldAllowed(meta, options.readablePermissionFields)) {
			return;
		}
		const entries = formatArrayField(
			meta.exportKey,
			value,
			options.audience,
			options.translateFn,
		);
		Object.entries(entries).forEach(([key, formattedValue]) => {
			if (!isExportKeyAllowed(key, options.readablePermissionFields)) return;
			output.set(key, formattedValue);
		});
		return;
	}

	if (isObjectRecord(value)) {
		if (!isExportFieldAllowed(meta, options.readablePermissionFields)) {
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

	if (!isExportFieldAllowed(meta, options.readablePermissionFields)) {
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
	const normalizePermissionFields = (fields: Iterable<string>) =>
		Array.from(fields)
			.map((field) => normalizeInstitutionPermissionField(field))
			.filter((field): field is string => Boolean(field));
	const readablePermissionFieldOrder = options.readablePermissionFields
		? normalizePermissionFields(options.readablePermissionFields)
		: null;
	const readablePermissionFields = readablePermissionFieldOrder
		? new Set(readablePermissionFieldOrder)
		: null;
	const audience = options.audience ?? "internal";
	const columnOrder: string[] = [];
	const rows = institutions
		.slice()
		.sort((a, b) => a.id - b.id)
		.map((institution) => {
			const output = new Map<string, string>();
			const rowReadablePermissionFields = options.getReadablePermissionFields
				? new Set(
						normalizePermissionFields(
							options.getReadablePermissionFields(institution),
						),
					)
				: readablePermissionFields;
			const rowAudience = options.getAudience
				? options.getAudience(institution)
				: audience;
			Object.entries(institution).forEach(([key, value]) => {
				collectExportValues(value, [key], output, {
					translateFn: options.translateFn,
					readablePermissionFields: rowReadablePermissionFields,
					audience: rowAudience,
				});
			});
			output.forEach((_, key) => {
				if (!columnOrder.includes(key)) {
					columnOrder.push(key);
				}
			});
			return output;
		});

	const preferredOrder = options.columnOrder
		? options.columnOrder
		: readablePermissionFieldOrder
			? getInstitutionExportColumnOrder(readablePermissionFieldOrder)
			: [];
	const orderedColumns = (() => {
		if (options.columnOrder) {
			return [
				...preferredOrder.filter((key) => columnOrder.includes(key)),
				...columnOrder.filter((key) => !preferredOrder.includes(key)),
			];
		}
		if (preferredOrder.length > 0) {
			return [
				...preferredOrder,
				...columnOrder.filter((key) => !preferredOrder.includes(key)),
			];
		}
		return columnOrder;
	})();

	return rows.map((row) => {
		const flattened: Record<string, string> = {};
		orderedColumns.forEach((fieldKey) => {
			flattened[translateColumnName(fieldKey, options.translateFn)] =
				row.get(fieldKey) ?? "";
		});
		return flattened;
	});
}

export function generateCSV(data: Record<string, string>[]): string {
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

const getExcelNoticeRows = (translateFn?: TranslateFn) =>
	EXCEL_NOTICE_DEFAULT_ROWS.map((defaultValue, index) => {
		if (!translateFn) return defaultValue;
		return translateFn(`common.download.exportNotice.row${index + 1}`, {
			defaultValue,
		});
	});

function applyExcelNotice(ws: XLSX.WorkSheet, translateFn?: TranslateFn) {
	const noticeRows = getExcelNoticeRows(translateFn);
	ws["!merges"] = [
		...(ws["!merges"] ?? []),
		...noticeRows.map((_, rowIndex) => ({
			s: { r: rowIndex, c: 0 },
			e: { r: rowIndex, c: EXCEL_NOTICE_MERGE_END_COLUMN },
		})),
	];

	noticeRows.forEach((noticeText, rowIndex) => {
		const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
		const linkTarget =
			rowIndex === 1 ? EXCEL_LEGAL_NOTICE_URL : getHyperlinkTarget(noticeText);
		ws[cellAddress] = {
			t: "s",
			v: noticeText,
			s: {
				font: {
					name: "Arial",
					sz: 12,
					bold: true,
					color: {
						rgb: linkTarget ? EXCEL_HYPERLINK_FONT_COLOR : "000000",
					},
					underline: Boolean(linkTarget),
				},
				alignment: {
					horizontal: "left",
					vertical: "top",
					wrapText: true,
				},
			},
		};
		if (linkTarget) {
			ws[cellAddress].l = {
				Target: linkTarget,
				Tooltip: linkTarget,
			};
		}
	});

	ws["!rows"] = [
		{ hpt: 22 },
		{ hpt: 32 },
		{ hpt: 22 },
		{ hpt: 22 },
		{ hpt: 8 },
	];
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

function applyExcelDataCellStyle(
	ws: XLSX.WorkSheet,
	data: Record<string, string>[],
) {
	if (data.length === 0) return;

	const headers = Object.keys(data[0]);
	data.forEach((_row, rowIndex) => {
		headers.forEach((_header, colIndex) => {
			const cellAddress = XLSX.utils.encode_cell({
				r: EXCEL_NOTICE_ROWS + 1 + rowIndex,
				c: colIndex,
			});
			const cell = ws[cellAddress];
			if (!cell) return;

			cell.s = {
				...(cell.s ?? {}),
				alignment: {
					...((cell.s as XLSX.CellObject["s"])?.alignment ?? {}),
					vertical: "top",
					wrapText: true,
				},
			};
		});
	});
}

function getHyperlinkTarget(value: string): string | null {
	const trimmedValue = value.trim();
	if (!trimmedValue) return null;

	if (/^https?:\/\/\S+$/i.test(trimmedValue)) {
		return trimmedValue;
	}

	if (/^mailto:\S+@\S+\.\S+$/i.test(trimmedValue)) {
		return trimmedValue;
	}

	if (/^www\.\S+\.\S+$/i.test(trimmedValue)) {
		return `https://${trimmedValue}`;
	}

	return null;
}

function applyExcelHyperlinks(
	ws: XLSX.WorkSheet,
	data: Record<string, string>[],
) {
	if (data.length === 0) return;

	const headers = Object.keys(data[0]);
	data.forEach((row, rowIndex) => {
		headers.forEach((header, colIndex) => {
			const value = row[header];
			if (typeof value !== "string") return;
			const hyperlinkTarget = getHyperlinkTarget(value);
			if (!hyperlinkTarget) return;

			const cellAddress = XLSX.utils.encode_cell({
				r: EXCEL_NOTICE_ROWS + 1 + rowIndex,
				c: colIndex,
			});
			const cell = ws[cellAddress];
			if (!cell) return;

			cell.l = {
				Target: hyperlinkTarget,
				Tooltip: hyperlinkTarget,
			};
			cell.s = {
				...(cell.s ?? {}),
				font: {
					...((cell.s as XLSX.CellObject["s"])?.font ?? {}),
					color: { rgb: EXCEL_HYPERLINK_FONT_COLOR },
					underline: true,
				},
			};
		});
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
	translateFn?: TranslateFn,
): ArrayBuffer {
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.aoa_to_sheet([]);
	applyExcelNotice(ws, translateFn);

	if (data.length > 0) {
		XLSX.utils.sheet_add_json(ws, data, {
			origin: `A${EXCEL_NOTICE_ROWS + 1}`,
		});
		applyExcelHeaderStyle(ws, Object.keys(data[0]));
		applyExcelDataCellStyle(ws, data);
		applyExcelHyperlinks(ws, data);
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
	const institutionIds = data.map((institution) => institution.id);
	const {
		readableFields,
		guestReadableFields,
		columnFields,
		audience,
		internalInstitutionIds,
	} = await getDownloadReadableFields("institution", institutionIds);
	const internalInstitutionIdSet = Array.isArray(internalInstitutionIds)
		? new Set(internalInstitutionIds)
		: null;
	const isInternalInstitution = (institution: Institution) => {
		if (audience === "guest") return false;
		if (!internalInstitutionIdSet) return true;
		return internalInstitutionIdSet.has(institution.id);
	};
	const preparedData = prepareDataForExport(data, {
		translateFn,
		readablePermissionFields: columnFields,
		getReadablePermissionFields: (institution) => {
			return isInternalInstitution(institution)
				? readableFields
				: guestReadableFields;
		},
		getAudience: (institution) =>
			isInternalInstitution(institution) ? "internal" : "guest",
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
			const xlsxBuffer = generateExcelBuffer(preparedData, "xlsx", translateFn);
			downloadBinaryFile(
				xlsxBuffer,
				fullFilename,
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);
			break;
		}
		case "xls": {
			const xlsBuffer = generateExcelBuffer(preparedData, "xls", translateFn);
			downloadBinaryFile(xlsBuffer, fullFilename, "application/vnd.ms-excel");
			break;
		}
		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}
