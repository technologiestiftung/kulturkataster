import type { InstitutionForm, InstitutionUpdateForm } from "@/types";

export const RELATION_FIELD_ALIASES: Record<string, string> = {
	categoryIds: "categories",
	tagIds: "tags",
	userIds: "users",
	groupIds: "groups",
	contact_person_id: "contact_person",
	funding_source: "funding_sources",
};

const buildIgnoreFields = () => {
	const ignored = new Set(Object.keys(RELATION_FIELD_ALIASES));
	ignored.add("id");
	ignored.add("address");
	return ignored;
};

export const buildInstitutionPermissionFields = (
	input: InstitutionForm | InstitutionUpdateForm,
): string[] => {
	const fields = new Set<string>();
	const ignoreFields = buildIgnoreFields();

	Object.keys(input)
		.filter((key) => !ignoreFields.has(key))
		.forEach((key) => fields.add(key));

	Object.entries(RELATION_FIELD_ALIASES).forEach(([inputKey, alias]) => {
		const value = input[inputKey as keyof InstitutionForm];
		if (typeof value === "undefined") return;
		if (Array.isArray(value)) {
			if (value.length > 0) fields.add(alias);
			return;
		}
		fields.add(alias);
	});

	if (input.address) fields.add("address");

	return Array.from(fields);
};

const getPermissionFieldForInputKey = (key: string): string | null => {
	if (key === "id") return null;
	if (key === "address") return "address";
	if (key in RELATION_FIELD_ALIASES) {
		return RELATION_FIELD_ALIASES[key] ?? null;
	}
	return key;
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
		if (!allowedFields.has(permissionField)) continue;
		(filtered as Record<string, unknown>)[key] = value;
	}

	return filtered;
};
