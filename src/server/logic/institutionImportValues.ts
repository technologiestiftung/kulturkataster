import {
	FundingType,
	InstitutionStatus,
	OwnerType,
	ProtectionStatus,
	RentalContractType,
	UtilizationStatus,
} from "@/generated/prisma";
import { translateEnumValue } from "@/lib/utils/downloadUtils";
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

export type CellResult<T> =
	| { ok: true; value: T }
	| { ok: false; code: ImportIssueCode };

const ok = <T>(value: T): CellResult<T> => ({ ok: true, value });
const fail = (code: ImportIssueCode): CellResult<never> => ({
	ok: false,
	code,
});

const LIST_SEPARATOR = /\s*;\s*/;
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
	const date = new Date(Date.UTC(year, month - 1, day));
	const isRealDate =
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day;
	return isRealDate ? ok(date) : fail("invalidDate");
};

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
	const categoryMap = new Map<string, number>();
	lookups.categories.forEach((category) => {
		categoryMap.set(normalizeLookupKey(category.key), category.id);
		categoryMap.set(
			normalizeLookupKey(translateEnumValue("categories", category.key, t)),
			category.id,
		);
	});
	const tagMap = new Map(
		lookups.tags.map((tag) => [normalizeLookupKey(tag.name), tag.id]),
	);
	const groupMap = new Map(
		lookups.groups.map((group) => [normalizeLookupKey(group.name), group.id]),
	);
	const fundingSourceNames = Object.keys(
		(t("enumMap.funding_source", { returnObjects: true }) as unknown as Record<
			string,
			string
		>) ?? {},
	);
	const fundingSourceMap = buildReverseLabelMap(fundingSourceNames, (name) =>
		translateEnumValue("funding_sources", name, t),
	);

	const parseIdList = (
		cell: string,
		map: Map<string, number>,
		code: ImportIssueCode,
	): CellResult<number[]> => {
		const ids: number[] = [];
		for (const item of splitList(cell)) {
			const id = map.get(normalizeLookupKey(item));
			if (typeof id === "undefined") return fail(code);
			ids.push(id);
		}
		return ok(ids);
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
			parseIdList(cell, categoryMap, "unknownCategory"),
		parseTags: (cell: string) => parseIdList(cell, tagMap, "unknownTag"),
		parseGroups: (cell: string) => parseIdList(cell, groupMap, "unknownGroup"),
		parseFundingSources: (cell: string): CellResult<FundingSourceInput[]> =>
			ok(
				splitList(cell).map((item) => {
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
