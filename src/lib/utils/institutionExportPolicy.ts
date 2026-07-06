import { normalizeInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";

export type ExportAudience = "guest" | "internal";

const EXPORT_KEYS_BY_PERMISSION_FIELD: Record<string, readonly string[]> = {
	"address.street": ["street"],
	"address.address_suffix": ["address_suffix"],
	"address.zipcode": ["zipcode"],
	"address.city": ["city"],
	"address.district": ["district"],
	"address.neighbourhood": ["neighbourhood"],
	"address.cultural_area": ["cultural_area"],
	"address.lat": ["lat"],
	"address.lng": ["lng"],
	"contact_person.first_name": ["contact_person_first_name"],
	"contact_person.last_name": ["contact_person_last_name"],
	"contact_person.email": ["contact_person_email"],
	"contact_person.phone": ["contact_person_phone"],
};

export const getInstitutionExportColumnOrder = (
	permissionFields: readonly string[],
): string[] => {
	const orderedFields = permissionFields
		.map((field) => normalizeInstitutionPermissionField(field))
		.filter((field): field is string => Boolean(field));
	const orderedColumns: string[] = [];

	orderedFields.forEach((field) => {
		const exportKeys = EXPORT_KEYS_BY_PERMISSION_FIELD[field] ?? [field];
		exportKeys.forEach((exportKey) => {
			if (!orderedColumns.includes(exportKey)) {
				orderedColumns.push(exportKey);
			}
		});
	});

	return orderedColumns;
};
