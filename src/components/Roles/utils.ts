/* eslint-disable complexity */
import type { RolePermissions, FieldPermissionsMap } from "./types";
import { INSTITUTION_FIELDS } from "./types";

export const createFieldPermissions = (
	view: boolean,
	requestChange: boolean,
	approveChange: boolean,
): FieldPermissionsMap => {
	return INSTITUTION_FIELDS.reduce((acc, field) => {
		acc[field] = { view, requestChange, approveChange };
		return acc;
	}, {} as FieldPermissionsMap);
};

export function getPermissionSummary(
	permissions: RolePermissions,
): string {
	const parts: string[] = [];

	const fieldValues = Object.values(permissions.fields);
	const viewableFields = fieldValues.filter((f) => f.view).length;
	const requestChangeFields = fieldValues.filter((f) => f.requestChange).length;
	const approveChangeFields = fieldValues.filter((f) => f.approveChange).length;
	const totalFields = INSTITUTION_FIELDS.length;

	if (approveChangeFields === totalFields) {
		parts.push("Alle Felder ändern & freigeben");
	} else if (approveChangeFields > 0) {
		parts.push(
			`${approveChangeFields}/${totalFields} Felder ändern & freigeben`,
		);
	} else if (requestChangeFields > 0) {
		parts.push(`${requestChangeFields}/${totalFields} Felder vorschlagen`);
	} else if (viewableFields > 0) {
		parts.push(`${viewableFields}/${totalFields} Felder ansehen`);
	}
	const entityPerms: string[] = [];
	if (permissions.createInstitution) entityPerms.push("Erstellen");
	if (permissions.publishInstitution) entityPerms.push("Veröffentlichen");
	if (permissions.changeStatus) entityPerms.push("Statusänderung");
	if (permissions.deleteInstitution) entityPerms.push("Löschen");

	if (entityPerms.length > 0) {
		parts.push(entityPerms.join(", "));
	}

	return parts.join(" | ");
}
