import {
	prepareDataForExport,
	translateColumnName,
} from "@/lib/utils/downloadUtils";
import { CULTURE_INDEX_SCORE_FIELDS } from "@/lib/constants/cultureIndexRanges";
import { splitStreetLine } from "@/lib/utils/formUtils";
import { getInstitutionExportColumnOrder } from "@/lib/utils/institutionExportPolicy";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";
import {
	CONTACT_PERSON_FLAT_FIELD_MAP,
	CONTACT_PERSON_FLAT_FIELDS,
} from "@/lib/utils/institutionRelationFields";
import {
	INSTITUTION_PERMISSION_FIELDS,
	type Institution,
	type InstitutionForm,
	type InstitutionUpdateForm,
} from "@/types";
import { z } from "@/server/validation/common";
import {
	validateInstitutionCreateInput,
	validateInstitutionUpdateInput,
} from "@/server/validation/institutions";
import type { ImportIssue, ImportIssueCode } from "@/types/institutionImport";
import {
	createValueParsers,
	ENUM_VALUES_BY_KEY,
	parseDate,
	parseNumber,
	parseText,
	type CellResult,
	type ImportLookups,
	type ImportTranslateFn,
	type ValueParsers,
} from "./institutionImportValues";

export type { ImportLookups, ImportTranslateFn };

export type ImportColumnsResult =
	| { ok: true; locale: string; keys: string[] }
	| {
			ok: false;
			error: "unknownColumns" | "missingColumns";
			columns: string[];
	  };

export type ImportPlan = {
	creates: ImportPlanEntry<InstitutionForm>[];
	updates: ImportPlanEntry<InstitutionUpdateForm>[];
	unchangedCount: number;
	issues: ImportIssue[];
};

type ImportPlanEntry<T> = {
	form: T;
	permissionFields: string[];
};

type ExistingInstitution = Institution & {
	funding_sources?: Institution["funding_sources"];
};

type RowPatch = {
	form: Record<string, unknown>;
	address: Record<string, unknown>;
	categories?: number[];
	subcategories?: number[];
};

const ID_KEY = "id";
const NAME_KEY = "name";
const REQUIRED_KEYS = [ID_KEY, NAME_KEY];
// Columns that are exported for information only and never written back.
const READ_ONLY_KEYS = new Set([ID_KEY, "users", "created_at", "updated_at"]);
const ADDRESS_TEXT_FIELDS = [
	"address_suffix",
	"zipcode",
	"city",
	"district",
	"neighbourhood",
	"cultural_area",
] as const;
const ADDRESS_NUMBER_FIELDS = ["lat", "lng"] as const;
const ADDRESS_FIELDS = [
	"street",
	"street_number",
	...ADDRESS_TEXT_FIELDS,
	...ADDRESS_NUMBER_FIELDS,
] as const;
const ADDRESS_TEXT_KEYS = new Set<string>(ADDRESS_TEXT_FIELDS);
const ADDRESS_NUMBER_KEYS = new Set<string>(ADDRESS_NUMBER_FIELDS);
const DATE_KEYS = new Set([
	"rental_contract_end",
	"established_since",
	"established_until",
]);
const NUMBER_KEYS: Record<string, { integer: boolean }> = {
	area: { integer: false },
	number_of_rooms: { integer: true },
	capacity: { integer: true },
	culture_index: { integer: true },
	...Object.fromEntries(
		CULTURE_INDEX_SCORE_FIELDS.map((field) => [field, { integer: false }]),
	),
};
const VALIDATION_PATH_TO_KEY: Record<string, string> = {
	categoryIds: "categories",
	tagIds: "tags",
	groupIds: "groups",
};

export const IMPORT_COLUMN_KEYS = getInstitutionExportColumnOrder(
	INSTITUTION_PERMISSION_FIELDS,
);

const normalizeHeader = (value: string) => value.trim().toLowerCase();

// The export replaces line breaks with spaces, so compare cells the same way.
const normalizeCell = (value: string) =>
	value.replace(/\r\n|\r|\n/g, " ").trim();

/**
 * Maps the CSV header row to export keys. The export writes translated column
 * names, so the locale whose labels match the most headers wins.
 */
export function resolveImportColumns(
	headers: string[],
	translators: Record<string, ImportTranslateFn>,
): ImportColumnsResult {
	const candidates = Object.entries(translators).map(([locale, t]) => {
		const labelToKey = new Map<string, string>();
		IMPORT_COLUMN_KEYS.forEach((key) => {
			labelToKey.set(normalizeHeader(key), key);
			labelToKey.set(normalizeHeader(translateColumnName(key, t)), key);
		});
		const keys = headers.map(
			(header) => labelToKey.get(normalizeHeader(header)) ?? null,
		);
		return { locale, keys, score: keys.filter(Boolean).length };
	});
	const best = candidates.sort((a, b) => b.score - a.score)[0];
	if (!best) return { ok: false, error: "unknownColumns", columns: headers };

	const unknownColumns = headers.filter(
		(header, index) =>
			!best.keys[index] || best.keys.indexOf(best.keys[index]) !== index,
	);
	if (unknownColumns.length > 0) {
		return { ok: false, error: "unknownColumns", columns: unknownColumns };
	}

	const keys = best.keys as string[];
	const missingKeys = REQUIRED_KEYS.filter((key) => !keys.includes(key));
	if (missingKeys.length > 0) {
		const t = translators[best.locale];
		return {
			ok: false,
			error: "missingColumns",
			columns: missingKeys.map((key) => translateColumnName(key, t)),
		};
	}

	return { ok: true, locale: best.locale, keys };
}

const parseCell = (
	key: string,
	cell: string,
	parsers: ValueParsers,
): CellResult<unknown> => {
	if (key === "status" && !cell.trim()) {
		return { ok: false, code: "emptyRequired" };
	}
	if (ENUM_VALUES_BY_KEY[key]) return parsers.parseEnum(key, cell);
	if (DATE_KEYS.has(key)) return parseDate(cell);
	if (NUMBER_KEYS[key]) return parseNumber(cell, NUMBER_KEYS[key]);
	if (ADDRESS_NUMBER_KEYS.has(key)) return parseNumber(cell);
	switch (key) {
		case "shared_use_allowed":
			return parsers.parseBoolean(cell);
		case "tags":
			return parsers.parseTags(cell);
		case "groups":
			return parsers.parseGroups(cell);
		case "funding_sources":
			return parsers.parseFundingSources(cell);
		default:
			return parseText(cell);
	}
};

const applyValue = (
	patch: RowPatch,
	key: string,
	cell: string,
	value: unknown,
) => {
	if (key === "street") {
		const { street, streetNumber } = splitStreetLine(cell);
		patch.address.street = street || null;
		patch.address.street_number = streetNumber || null;
	} else if (ADDRESS_TEXT_KEYS.has(key) || ADDRESS_NUMBER_KEYS.has(key)) {
		patch.address[key] = value;
	} else if (key === "tags") {
		patch.form.tagIds = value;
	} else if (key === "groups") {
		patch.form.groupIds = value;
	} else {
		patch.form[key] = value;
	}
};

type ReportIssue = (
	key: string,
	code: ImportIssueCode,
	values?: string[],
) => void;

const buildRowPatch = (
	keys: string[],
	cells: Map<string, string>,
	parsers: ValueParsers,
	reportIssue: ReportIssue,
	existing?: ExistingInstitution,
): RowPatch => {
	const patch: RowPatch = { form: {}, address: {} };
	let parentIds: number[] | undefined;
	if (
		(keys.includes("categories") || keys.includes("subcategories")) &&
		cells.has("categories")
	) {
		const categories = parsers.parseCategories(cells.get("categories") ?? "");
		if (!categories.ok) {
			reportIssue("categories", categories.code, categories.values);
		} else {
			parentIds = categories.value;
			if (keys.includes("categories")) patch.categories = categories.value;
		}
	} else if (existing) {
		parentIds = existing.categories
			.filter(
				(category) =>
					isActiveCategory(category) && category.parent_category_id === null,
			)
			.map((category) => category.id);
	}
	const categoryColumnsTouched =
		keys.includes("categories") || keys.includes("subcategories");
	if (categoryColumnsTouched && cells.has("subcategories")) {
		const subcategories = parsers.parseSubcategories(
			cells.get("subcategories") ?? "",
			parentIds,
		);
		if (!subcategories.ok) {
			reportIssue("subcategories", subcategories.code, subcategories.values);
		} else {
			patch.subcategories = subcategories.value;
		}
	} else if (keys.includes("categories") && existing && parentIds) {
		patch.subcategories = existing.categories
			.filter(
				(category) =>
					isActiveCategory(category) &&
					category.parent_category_id !== null &&
					parentIds.includes(category.parent_category_id),
			)
			.map((category) => category.id);
	}
	keys.forEach((key) => {
		if (
			READ_ONLY_KEYS.has(key) ||
			key === "categories" ||
			key === "subcategories"
		)
			return;
		const cell = cells.get(key) ?? "";
		const result = parseCell(key, cell, parsers);
		if (!result.ok) {
			reportIssue(key, result.code, result.values);
			return;
		}
		applyValue(patch, key, cell, result.value);
	});
	return patch;
};

const isActiveCategory = (category: { status?: string }) =>
	category.status === undefined || category.status === "active";

const resolveCategoryIds = (
	patch: RowPatch,
	existing?: ExistingInstitution,
): number[] | undefined => {
	if (!patch.categories && !patch.subcategories) return undefined;
	const allExistingCategories = existing?.categories ?? [];
	const existingCategories = allExistingCategories.filter(isActiveCategory);
	// Inactive categories are not exported, so the file cannot remove them.
	const inactiveIds = allExistingCategories
		.filter((category) => !isActiveCategory(category))
		.map((category) => category.id);
	const parentIds =
		patch.categories ??
		existingCategories
			.filter((category) => category.parent_category_id === null)
			.map((category) => category.id);
	const childIds =
		patch.subcategories ??
		existingCategories
			.filter((category) => category.parent_category_id !== null)
			.map((category) => category.id);
	return [...parentIds, ...childIds, ...inactiveIds];
};

const buildCreateForm = (patch: RowPatch): InstitutionForm => {
	const hasAddress = Object.values(patch.address).some(
		(value) => value !== null && value !== undefined,
	);
	return {
		...patch.form,
		name: (patch.form.name as string | null) ?? "",
		address: hasAddress ? (patch.address as InstitutionForm["address"]) : null,
		categoryIds: resolveCategoryIds(patch),
	} as InstitutionForm;
};

const buildUpdateForm = (
	patch: RowPatch,
	existing: ExistingInstitution,
): InstitutionUpdateForm => {
	const form: Record<string, unknown> = {
		...patch.form,
		id: existing.id,
		name: "name" in patch.form ? (patch.form.name ?? "") : existing.name,
		categoryIds: resolveCategoryIds(patch, existing),
		// The address is only written when one of its columns changed.
		address: null,
	};

	if (Object.keys(patch.address).length > 0) {
		const existingAddress = existing.address
			? Object.fromEntries(
					ADDRESS_FIELDS.map((field) => [field, existing.address?.[field]]),
				)
			: {};
		form.address = {
			...existingAddress,
			...(existing.address ? { id: existing.address.id } : {}),
			...patch.address,
		};
	}

	const touchesContactPerson = CONTACT_PERSON_FLAT_FIELDS.some(
		(field) => field in patch.form,
	);
	if (touchesContactPerson) {
		CONTACT_PERSON_FLAT_FIELDS.forEach((field) => {
			if (field in patch.form) return;
			const nestedField = CONTACT_PERSON_FLAT_FIELD_MAP[field];
			form[field] = existing.contact_person?.[nestedField] ?? null;
		});
	}

	return form as InstitutionUpdateForm;
};

const getValidationIssueKey = (path: PropertyKey[]) => {
	const [root, leaf] = path.map(String);
	if (root === "address" && leaf) {
		return leaf === "street_number" ? "street" : leaf;
	}
	return VALIDATION_PATH_TO_KEY[root] ?? root;
};

const validateForm = <T>(
	validate: () => T,
	reportIssue: (key: string, code: ImportIssueCode) => void,
): T | null => {
	try {
		return validate();
	} catch (error) {
		if (!(error instanceof z.ZodError)) throw error;
		error.issues.forEach((issue) => {
			const key = getValidationIssueKey(issue.path);
			reportIssue(key, key === NAME_KEY ? "emptyRequired" : "invalidValue");
		});
		return null;
	}
};

const getChangedKeys = (
	keys: string[],
	cells: Map<string, string>,
	existing: ExistingInstitution,
	t: ImportTranslateFn,
) => {
	// Compare against what the account export writes, which lists active categories only.
	const exportedInstitution = {
		...existing,
		categories: existing.categories?.filter(isActiveCategory) ?? [],
	};
	const [currentRow = {}] = prepareDataForExport([exportedInstitution], {
		translateFn: t,
	});
	return keys.filter((key) => {
		if (READ_ONLY_KEYS.has(key)) return false;
		const currentValue = currentRow[translateColumnName(key, t)] ?? "";
		return normalizeCell(cells.get(key) ?? "") !== normalizeCell(currentValue);
	});
};

type RowContext = {
	headers: string[];
	keys: string[];
	t: ImportTranslateFn;
	parsers: ValueParsers;
	existingById: Map<number, ExistingInstitution>;
	seenIds: Set<number>;
};

type RowOutcome =
	| { kind: "create"; entry: ImportPlanEntry<InstitutionForm> }
	| { kind: "update"; entry: ImportPlanEntry<InstitutionUpdateForm> }
	| { kind: "unchanged" }
	| { kind: "invalid"; issues: ImportIssue[] };

const resolveExistingInstitution = (
	idCell: string,
	context: RowContext,
): { existing?: ExistingInstitution; issue?: ImportIssueCode } => {
	if (!idCell) return {};
	const id = parseNumber(idCell, { integer: true });
	if (!id.ok || !id.value || id.value <= 0) return { issue: "invalidInteger" };
	if (context.seenIds.has(id.value)) return { issue: "duplicateId" };
	context.seenIds.add(id.value);
	const existing = context.existingById.get(id.value);
	return existing ? { existing } : { issue: "unknownId" };
};

const getImportPermissionFields = (
	keys: string[],
	cells: Map<string, string>,
	isCreate: boolean,
) =>
	Array.from(
		new Set(
			keys
				.filter(
					(key) =>
						!READ_ONLY_KEYS.has(key) &&
						(!isCreate || Boolean(cells.get(key)?.trim())),
				)
				.map(normalizeInstitutionPermissionField)
				.filter((field): field is string => field !== null),
		),
	);

const planRow = (
	row: string[],
	rowNumber: number,
	context: RowContext,
): RowOutcome => {
	const { headers, keys, t } = context;
	const issues: ImportIssue[] = [];
	const reportIssue: ReportIssue = (key, code, values) => {
		const column = headers[keys.indexOf(key)] ?? translateColumnName(key, t);
		if (issues.some((issue) => issue.column === column)) return;
		issues.push({
			row: rowNumber,
			column,
			code,
			...(values ? { values } : {}),
		});
	};
	const invalid = (): RowOutcome => ({ kind: "invalid", issues });
	const cells = new Map(
		keys.map((key, index) => [key, (row[index] ?? "").trim()]),
	);

	const { existing, issue } = resolveExistingInstitution(
		cells.get(ID_KEY) ?? "",
		context,
	);
	if (issue) {
		reportIssue(ID_KEY, issue);
		return invalid();
	}

	const keysToApply = existing
		? getChangedKeys(keys, cells, existing, t)
		: keys;
	if (existing && keysToApply.length === 0) return { kind: "unchanged" };

	const patch = buildRowPatch(
		keysToApply,
		cells,
		context.parsers,
		reportIssue,
		existing,
	);
	if (issues.length > 0) return invalid();

	if (existing) {
		const form = buildUpdateForm(patch, existing);
		const validated = validateForm(
			() => validateInstitutionUpdateInput(form),
			reportIssue,
		);
		return validated
			? {
					kind: "update",
					entry: {
						form: validated,
						permissionFields: getImportPermissionFields(
							keysToApply,
							cells,
							false,
						),
					},
				}
			: invalid();
	}

	const form = buildCreateForm(patch);
	const validated = validateForm(
		() => validateInstitutionCreateInput(form),
		reportIssue,
	);
	return validated
		? {
				kind: "create",
				entry: {
					form: validated,
					permissionFields: getImportPermissionFields(keysToApply, cells, true),
				},
			}
		: invalid();
};

/**
 * Validates every row and decides whether it creates, updates or leaves a place
 * unchanged. Nothing is written here, so an invalid file never changes data.
 */
export function planInstitutionImport({
	headers,
	keys,
	rows,
	t,
	lookups,
	existingById,
	rowNumbers,
}: {
	headers: string[];
	keys: string[];
	rows: string[][];
	t: ImportTranslateFn;
	lookups: ImportLookups;
	existingById: Map<number, ExistingInstitution>;
	// Source row of each data row; notice rows and dropped blank rows make them non-contiguous.
	rowNumbers: number[];
}): ImportPlan {
	const context: RowContext = {
		headers,
		keys,
		t,
		parsers: createValueParsers(t, lookups),
		existingById,
		seenIds: new Set(),
	};
	const plan: ImportPlan = {
		creates: [],
		updates: [],
		unchangedCount: 0,
		issues: [],
	};

	rows.forEach((row, rowIndex) => {
		const rowNumber = rowNumbers[rowIndex];
		if (row.length !== headers.length) {
			plan.issues.push({
				row: rowNumber,
				column: headers[0] ?? translateColumnName(ID_KEY, t),
				code: "columnCountMismatch",
			});
			return;
		}
		const outcome = planRow(row, rowNumber, context);
		if (outcome.kind === "create") plan.creates.push(outcome.entry);
		else if (outcome.kind === "update") plan.updates.push(outcome.entry);
		else if (outcome.kind === "unchanged") plan.unchangedCount++;
		else plan.issues.push(...outcome.issues);
	});

	return plan;
}
