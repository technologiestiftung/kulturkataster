import {
	INSTITUTION_PERMISSION_FIELDS,
	type InstitutionForm,
	type InstitutionUpdateForm,
} from "@/types";
import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";

export const RELATION_FIELD_ALIASES: Record<string, string> = {
	categoryIds: "categories",
	tagIds: "tags",
	userIds: "users",
	groupIds: "groups",
	contact_person_first_name: "contact_person.first_name",
	contact_person_last_name: "contact_person.last_name",
	contact_person_email: "contact_person.email",
	contact_person_phone: "contact_person.phone",
	funding_source: "funding_sources",
};

const INTERNAL_INPUT_FIELDS = new Set(["id", "contact_person_id"]);

const RELATION_PERMISSION_FIELDS: Map<string, Set<string>> = (
	INSTITUTION_PERMISSION_FIELDS as readonly string[]
).reduce((fieldsByRelation, field) => {
	const separatorIndex = field.indexOf(".");
	if (separatorIndex <= 0) return fieldsByRelation;
	const relation = field.slice(0, separatorIndex);
	if (!fieldsByRelation.has(relation)) {
		fieldsByRelation.set(relation, new Set());
	}
	fieldsByRelation.get(relation)?.add(field);
	return fieldsByRelation;
}, new Map<string, Set<string>>());

const addFieldIfValueIsPresent = (
	fields: Set<string>,
	field: string,
	value: unknown,
) => {
	if (typeof value === "undefined") return;
	if (Array.isArray(value) && value.length === 0) return;
	fields.add(field);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const getRelationPermissionField = (
	relationKey: string,
	childKey: string,
): string | null => {
	const permissionField = normalizeInstitutionPermissionField(
		`${relationKey}.${childKey}`,
	);
	if (!permissionField) return null;
	const relationFields = RELATION_PERMISSION_FIELDS.get(relationKey);
	if (!relationFields?.has(permissionField)) return null;
	return permissionField;
};

const collectRelationPermissionFields = (
	fields: Set<string>,
	relationKey: string,
	value: unknown,
) => {
	if (!isRecord(value)) return;
	for (const [childKey, childValue] of Object.entries(value)) {
		const permissionField = getRelationPermissionField(relationKey, childKey);
		if (!permissionField) continue;
		addFieldIfValueIsPresent(fields, permissionField, childValue);
	}
};

export const buildInstitutionPermissionFields = (
	input: InstitutionForm | InstitutionUpdateForm,
): string[] => {
	const fields = new Set<string>();

	for (const [key, value] of Object.entries(input)) {
		if (INTERNAL_INPUT_FIELDS.has(key)) continue;
		const alias = RELATION_FIELD_ALIASES[key];
		if (alias) {
			addFieldIfValueIsPresent(fields, alias, value);
			continue;
		}
		if (RELATION_PERMISSION_FIELDS.has(key)) {
			collectRelationPermissionFields(fields, key, value);
			continue;
		}
		addFieldIfValueIsPresent(fields, key, value);
	}

	return Array.from(fields);
};

const getPermissionFieldForInputKey = (key: string): string | null => {
	if (INTERNAL_INPUT_FIELDS.has(key)) return null;
	if (key in RELATION_FIELD_ALIASES) {
		return RELATION_FIELD_ALIASES[key] ?? null;
	}
	return key;
};

const filterRelationValueByPermissionFields = (
	relationKey: string,
	value: unknown,
	allowedFields: Set<string>,
): Record<string, unknown> | null => {
	if (!isRecord(value)) return null;
	const filtered: Record<string, unknown> = {};
	for (const [childKey, childValue] of Object.entries(value)) {
		const permissionField = getRelationPermissionField(relationKey, childKey);
		if (!permissionField || !allowedFields.has(permissionField)) continue;
		filtered[childKey] = childValue;
	}
	if (
		relationKey === "address" &&
		Object.keys(filtered).length > 0 &&
		"id" in value
	) {
		filtered.id = value.id;
	}
	return Object.keys(filtered).length > 0 ? filtered : null;
};

export const filterInstitutionInputByPermissionFields = <
	T extends InstitutionForm | InstitutionUpdateForm,
>(
	input: T,
	allowedFields: Set<string>,
): Partial<T> => {
	const filtered = {} as Partial<T>;

	for (const [key, value] of Object.entries(input)) {
		if (typeof value === "undefined") continue;
		const permissionField = getPermissionFieldForInputKey(key);
		if (!permissionField) continue;
		if (RELATION_PERMISSION_FIELDS.has(permissionField)) {
			const relationValue = filterRelationValueByPermissionFields(
				permissionField,
				value,
				allowedFields,
			);
			if (!relationValue) continue;
			(filtered as Record<string, unknown>)[key] = relationValue;
			continue;
		}
		if (!allowedFields.has(permissionField)) continue;
		(filtered as Record<string, unknown>)[key] = value;
	}

	return filtered;
};
