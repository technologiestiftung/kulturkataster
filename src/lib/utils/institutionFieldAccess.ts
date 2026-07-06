import type { FieldConfig } from "@/components/FormWrapper";
import { resolveInstitutionPermissionField } from "@/lib/utils/institutionPermissionField";

type InstitutionFieldPermissions = {
	read: string[];
	create: string[];
	update: string[];
	delete: string[];
	download: string[];
};

type ResolveAccessParams = {
	field: FieldConfig;
	mode: "create" | "edit";
	permissions: InstitutionFieldPermissions | null;
};

const copyField = (field: FieldConfig): FieldConfig => {
	if (field.type !== "section") {
		return { ...field };
	}
	const nestedFields = Array.isArray(field.fields)
		? field.fields.map((nested) => copyField(nested))
		: undefined;
	return {
		...field,
		fields: nestedFields,
	};
};

const toFieldSet = (values: string[] | undefined): Set<string> =>
	new Set((values ?? []).filter(Boolean));

const resolveTopLevelField = (field: FieldConfig): string | null => {
	if (field.type === "section" || field.type === "actionPanel") return null;
	return resolveInstitutionPermissionField(field);
};

const resolveFieldAccess = ({
	field,
	mode,
	permissions,
}: ResolveAccessParams): { visible: boolean; disabled: boolean } => {
	if (field.type === "section" || field.type === "actionPanel") {
		return { visible: true, disabled: false };
	}
	if (!permissions) {
		return { visible: true, disabled: false };
	}

	const permissionField = resolveTopLevelField(field);
	if (!permissionField) {
		return { visible: true, disabled: false };
	}

	const readable = toFieldSet(permissions.read);
	const creatable = toFieldSet(permissions.create);
	const updatable = toFieldSet(permissions.update);

	if (mode === "create") {
		if (!creatable.has(permissionField)) {
			return { visible: false, disabled: true };
		}
		return { visible: true, disabled: false };
	}

	if (!readable.has(permissionField)) {
		return { visible: false, disabled: true };
	}
	return { visible: true, disabled: !updatable.has(permissionField) };
};

const shapeField = (
	field: FieldConfig,
	mode: "create" | "edit",
	permissions: InstitutionFieldPermissions | null,
): FieldConfig | null => {
	if (field.type === "section") {
		const nested = (field.fields ?? [])
			.map((nestedField) => shapeField(nestedField, mode, permissions))
			.filter((item): item is FieldConfig => item !== null);
		if (nested.length === 0) return null;
		return {
			...field,
			fields: nested,
		};
	}

	const access = resolveFieldAccess({
		field,
		mode,
		permissions,
	});
	if (!access.visible) return null;

	return {
		...copyField(field),
		disabled: Boolean(field.disabled) || access.disabled,
	};
};

export const applyInstitutionFieldAccess = ({
	fields,
	mode,
	permissions,
}: {
	fields: FieldConfig[];
	mode: "create" | "edit";
	permissions: InstitutionFieldPermissions | null;
}): FieldConfig[] => {
	return fields
		.map((field) => shapeField(field, mode, permissions))
		.filter((item): item is FieldConfig => item !== null);
};
