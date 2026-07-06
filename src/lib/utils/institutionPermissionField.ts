import { INSTITUTION_PERMISSION_FIELDS } from "@/types/institution";

const permissionFields = new Set<string>(
	INSTITUTION_PERMISSION_FIELDS as readonly string[],
);

const permissionFieldAliasMap: Record<string, string> = {
	street: "address.street",
	street_number: "address.street",
	streetLine: "address.street",
	"address.streetLine": "address.street",
	"address.street_number": "address.street",
	address_suffix: "address.address_suffix",
	zip: "address.zipcode",
	"address.zip": "address.zipcode",
	zipcode: "address.zipcode",
	city: "address.city",
	district: "address.district",
	neighbourhood: "address.neighbourhood",
	cultural_area: "address.cultural_area",
	lat: "address.lat",
	lng: "address.lng",
	contact_person_name: "contact_person.first_name",
	contact_person_first_name: "contact_person.first_name",
	contact_person_last_name: "contact_person.last_name",
	contact_person_email: "contact_person.email",
	contact_person_phone: "contact_person.phone",
	contact_person_surname: "contact_person.last_name",
	funding_source_name: "funding_sources",
	funding_source_description: "funding_sources",
	funding_source: "funding_sources",
	category: "categories",
	subcategory: "subcategories",
	subcategories: "subcategories",
};

[
	"address.address_suffix",
	"address.zipcode",
	"address.city",
	"address.district",
	"address.neighbourhood",
	"address.cultural_area",
	"address.lat",
	"address.lng",
	"contact_person.first_name",
	"contact_person.last_name",
	"contact_person.email",
	"contact_person.phone",
].forEach((field) => {
	permissionFieldAliasMap[field] = field;
});

export type InstitutionPermissionFieldCandidate = {
	permissionField?: string;
	labelKey?: string;
	value?: unknown;
	id?: string;
	name?: string;
};

export const normalizeInstitutionPermissionField = (
	field: string | undefined,
): string | null => {
	if (!field) return null;
	const alias = permissionFieldAliasMap[field] ?? field;
	return permissionFields.has(alias) ? alias : null;
};

export const resolveInstitutionPermissionField = (
	field: InstitutionPermissionFieldCandidate,
): string | null => {
	if (field.permissionField)
		return normalizeInstitutionPermissionField(field.permissionField);

	if (field.labelKey?.startsWith("field_names.")) {
		const key = field.labelKey.replace("field_names.", "");
		const normalized = normalizeInstitutionPermissionField(key);
		if (normalized) return normalized;
	}

	if (typeof field.value === "string") {
		const direct = normalizeInstitutionPermissionField(field.value);
		if (direct) return direct;
		const topLevelField = field.value.split(".")[0];
		const normalized = normalizeInstitutionPermissionField(topLevelField);
		if (normalized) return normalized;
	}

	if (field.id) {
		const normalized = normalizeInstitutionPermissionField(field.id);
		if (normalized) return normalized;
	}

	if (field.name) {
		const direct = normalizeInstitutionPermissionField(field.name);
		if (direct) return direct;
		const topLevelField = field.name.split(".")[0];
		const normalized = normalizeInstitutionPermissionField(topLevelField);
		if (normalized) return normalized;
	}

	return null;
};
