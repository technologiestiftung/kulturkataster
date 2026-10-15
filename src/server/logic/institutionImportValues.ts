import {
	FundingType,
	InstitutionStatus,
	OwnerType,
	ProtectionStatus,
	RentalContractType,
	UtilizationStatus,
} from "@/generated/prisma";
import { translateEnumValue } from "@/lib/utils/downloadUtils";
import { toUtcDate } from "@/lib/utils/partialDate";
import type { FundingSourceInput } from "@/types";
import type { ImportIssueCode } from "@/types/institutionImport";

export type ImportTranslateFn = (
	key: string,
	options?: Record<string, unknown>,
) => string;

export type ImportLookups = {
	categories: { id: number; key: string; parent_category_id: number | null }[];
	tags: { id: number; name: string }[];
	groups: { id: number; name: string }[];
};

type ImportCategory = ImportLookups["categories"][number];

export type CellResult<T> =
	| { ok: true; value: T }
	// `values` names the list items that could not be matched, so users can find them in the file.
	| { ok: false; code: ImportIssueCode; values?: string[] };

const ok = <T>(value: T): CellResult<T> => ({ ok: true, value });
const fail = (code: ImportIssueCode, values?: string[]): CellResult<never> => ({
	ok: false,
	code,
	...(values?.length ? { values } : {}),
});

const LIST_SEPARATOR = /\s*;\s*/;
const QUALIFIED_CATEGORY = /^(.+?)\s*\(([^()]+)\)$/;
const FUNDING_SOURCE_DESCRIPTION_SEPARATOR = ": ";

export const ENUM_VALUES_BY_KEY: Record<string, readonly string[]> = {
	owner_type: Object.values(OwnerType),
	rental_contract_type: Object.values(RentalContractType),
	funding_type: Object.values(FundingType),
	utilization_status: Object.values(UtilizationStatus),
	protection_status: Object.values(ProtectionStatus),
	status: Object.values(InstitutionStatus),
};

const normalizeLookupKey = (value: string) => value.trim().toLowerCase();

const splitList = (cell: string) =>
	cell
		.split(LIST_SEPARATOR)
		.map((item) => item.trim())
		.filter(Boolean);

// Maps both the raw value and its translated label (as written by the export) back to the raw value.
const buildReverseLabelMap = (
	values: readonly string[],
	getLabel: (value: string) => string,
) => {
	const map = new Map<string, string>();
	values.forEach((value) => {
		map.set(normalizeLookupKey(value), value);
		map.set(normalizeLookupKey(getLabel(value)), value);
	});
	return map;
};

export const parseText = (cell: string): CellResult<string | null> => {
	const trimmed = cell.trim();
	return ok(trimmed.length > 0 ? trimmed : null);
};

export const parseNumber = (
	cell: string,
	{ integer = false } = {},
): CellResult<number | null> => {
	const trimmed = cell.trim();
	if (!trimmed) return ok(null);
	// Accept a decimal comma as written by spreadsheet apps in German locales.
	if (!/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) return fail("invalidNumber");
	const value = Number(trimmed.replace(",", "."));
	if (integer && !Number.isInteger(value)) return fail("invalidInteger");
	return ok(value);
};

// Returns [year, month, day] for DD.MM.YYYY (export format) or YYYY-MM-DD.
const parseDateParts = (value: string): number[] | null => {
	const german = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
	if (german) return [german[3], german[2], german[1]].map(Number);
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (iso) return [iso[1], iso[2], iso[3]].map(Number);
	return null;
};

export const parseDate = (cell: string): CellResult<Date | null> => {
	const trimmed = cell.trim();
	if (!trimmed) return ok(null);
	const parts = parseDateParts(trimmed);
	if (!parts) return fail("invalidDate");
	const [year, month, day] = parts;
	const date = toUtcDate(year, month, day);
	return date ? ok(date) : fail("invalidDate");
};

type NamedEntry = { id: number; name: string };

// Longest names first, so "Kunst im öffentlichen Raum" wins over "Kunst".
const toNamedEntries = (items: NamedEntry[]): NamedEntry[] =>
	items
		.map(({ id, name }) => ({ id, name: name.trim() }))
		.filter(({ name }) => name.length > 0)
		.sort((a, b) => b.name.length - a.name.length);

const stripLeadingSeparators = (value: string) => value.replace(/^[\s;]+/, "");

const startsWithName = (text: string, name: string, ignoreCase: boolean) => {
	const head = text.slice(0, name.length);
	const isSameName = ignoreCase
		? head.toLowerCase() === name.toLowerCase()
		: head === name;
	return isSameName && /^\s*(;|$)/.test(text.slice(name.length));
};

// Tags like "urbane Praxis" and "Urbane Praxis" coexist, so the exact spelling wins
// and case is only ignored when no name matches exactly.
const findNamedEntryAt = (text: string, entries: NamedEntry[]) =>
	entries.find(({ name }) => startsWithName(text, name, false)) ??
	entries.find(({ name }) => startsWithName(text, name, true));

export const createValueParsers = (
	t: ImportTranslateFn,
	lookups: ImportLookups,
) => {
	const enumMaps = new Map(
		Object.entries(ENUM_VALUES_BY_KEY).map(([key, values]) => [
			key,
			buildReverseLabelMap(values, (value) =>
				translateEnumValue(key, value, t),
			),
		]),
	);
	const booleanMap = buildReverseLabelMap(["yes", "no", "none"], (value) =>
		translateEnumValue("shared_use_allowed", value, t),
	);
	const categoryMap = new Map<string, ImportCategory[]>();
	lookups.categories.forEach((category) => {
		[category.key, translateEnumValue("categories", category.key, t)].forEach(
			(label) => {
				const key = normalizeLookupKey(label);
				const matches = categoryMap.get(key) ?? [];
				if (!matches.some(({ id }) => id === category.id)) {
					categoryMap.set(key, [...matches, category]);
				}
			},
		);
	});
	const tagNames = toNamedEntries(lookups.tags);
	const groupNames = toNamedEntries(lookups.groups);
	const fundingSourceNames = Object.keys(
		(t("enumMap.funding_source", { returnObjects: true }) as unknown as Record<
			string,
			string
		>) ?? {},
	);
	const fundingSourceMap = buildReverseLabelMap(fundingSourceNames, (name) =>
		translateEnumValue("funding_sources", name, t),
	);
	const fundingSourceLabels = Array.from(fundingSourceMap.keys()).sort(
		(a, b) => b.length - a.length,
	);

	const parseCategoryList = (
		cell: string,
		isCandidate: (category: ImportCategory) => boolean,
	): CellResult<number[]> => {
		const ids: number[] = [];
		const unknownItems: string[] = [];
		const items = splitList(cell);
		const counts = new Map<string, number>();
		items.forEach((item) => {
			const key = normalizeLookupKey(item);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		});
		const usedCounts = new Map<string, number>();
		for (const item of items) {
			const key = normalizeLookupKey(item);
			const qualified = QUALIFIED_CATEGORY.exec(item);
			if (qualified) {
				// "Label (Parent label)" names the parent of a label shared by several parents.
				const parentIds = (
					categoryMap.get(normalizeLookupKey(qualified[2])) ?? []
				).map(({ id }) => id);
				const match = (
					categoryMap.get(normalizeLookupKey(qualified[1])) ?? []
				).find(
					(category) =>
						isCandidate(category) &&
						category.parent_category_id !== null &&
						parentIds.includes(category.parent_category_id),
				);
				if (match) ids.push(match.id);
				else unknownItems.push(item);
				continue;
			}
			const matches = (categoryMap.get(key) ?? []).filter(isCandidate);
			const used = usedCounts.get(key) ?? 0;
			usedCounts.set(key, used + 1);
			if (matches.length === 1) ids.push(matches[0].id);
			// The export lists a label shared by several selected parents once per parent.
			else if (matches.length > 1 && matches.length === counts.get(key)) {
				ids.push(matches[used].id);
			} else unknownItems.push(item);
		}
		return unknownItems.length > 0
			? fail("unknownCategory", unknownItems)
			: ok(ids);
	};
	const parseNamedIdList = (
		cell: string,
		entries: NamedEntry[],
		code: ImportIssueCode,
	): CellResult<number[]> => {
		const ids: number[] = [];
		const unknownItems: string[] = [];
		let remaining = stripLeadingSeparators(cell.trim());
		while (remaining) {
			const match = findNamedEntryAt(remaining, entries);
			// Names may contain ";", so an unknown item only runs up to the next separator.
			const consumedLength = match
				? match.name.length
				: (splitList(remaining)[0] ?? remaining).length;
			if (match) ids.push(match.id);
			else unknownItems.push(remaining.slice(0, consumedLength));
			remaining = stripLeadingSeparators(remaining.slice(consumedLength));
		}
		return unknownItems.length > 0 ? fail(code, unknownItems) : ok(ids);
	};
	const splitFundingSources = (cell: string) => {
		const items: string[] = [];
		let itemStart = 0;
		let separatorIndex = cell.indexOf("; ");
		while (separatorIndex >= 0) {
			const remainder = cell.slice(separatorIndex + 2).toLowerCase();
			const startsKnownSource = fundingSourceLabels.some(
				(label) => remainder === label || remainder.startsWith(`${label}: `),
			);
			if (startsKnownSource) {
				items.push(cell.slice(itemStart, separatorIndex).trim());
				itemStart = separatorIndex + 2;
			}
			separatorIndex = cell.indexOf("; ", separatorIndex + 2);
		}
		const finalItem = cell.slice(itemStart).trim();
		if (finalItem) items.push(finalItem);
		return items;
	};

	return {
		parseEnum: (key: string, cell: string): CellResult<string | null> => {
			const trimmed = cell.trim();
			if (!trimmed) return ok(null);
			const value = enumMaps.get(key)?.get(normalizeLookupKey(trimmed));
			return value ? ok(value) : fail("invalidOption");
		},
		parseBoolean: (cell: string): CellResult<boolean | null> => {
			const trimmed = cell.trim();
			if (!trimmed) return ok(null);
			const value = booleanMap.get(normalizeLookupKey(trimmed));
			if (!value) return fail("invalidOption");
			return ok(value === "none" ? null : value === "yes");
		},
		parseCategories: (cell: string) =>
			parseCategoryList(
				cell,
				({ parent_category_id }) => parent_category_id === null,
			),
		parseSubcategories: (cell: string, parentIds?: number[]) =>
			parseCategoryList(
				cell,
				({ parent_category_id }) =>
					parent_category_id !== null &&
					(parentIds === undefined || parentIds.includes(parent_category_id)),
			),
		parseTags: (cell: string) => parseNamedIdList(cell, tagNames, "unknownTag"),
		parseGroups: (cell: string) =>
			parseNamedIdList(cell, groupNames, "unknownGroup"),
		parseFundingSources: (cell: string): CellResult<FundingSourceInput[]> =>
			ok(
				splitFundingSources(cell).map((item) => {
					const separatorIndex = item.indexOf(
						FUNDING_SOURCE_DESCRIPTION_SEPARATOR,
					);
					const label =
						separatorIndex >= 0 ? item.slice(0, separatorIndex) : item;
					const description =
						separatorIndex >= 0
							? item
									.slice(
										separatorIndex +
											FUNDING_SOURCE_DESCRIPTION_SEPARATOR.length,
									)
									.trim()
							: "";
					return {
						source_name:
							fundingSourceMap.get(normalizeLookupKey(label)) ?? label.trim(),
						description: description || null,
					};
				}),
			),
	};
};

export type ValueParsers = ReturnType<typeof createValueParsers>;
