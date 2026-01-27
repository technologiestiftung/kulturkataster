import type { InstitutionForm, InstitutionUpdateForm } from "@/types";

const RELATION_FIELD_ALIASES: Record<string, string> = {
	categoryIds: "categories",
	tagIds: "tags",
	userIds: "users",
	groupIds: "groups",
	contact_person_id: "contact_person",
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
