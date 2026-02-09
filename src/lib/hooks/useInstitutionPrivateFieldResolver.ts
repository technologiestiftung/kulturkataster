"use client";

import { useCallback, useMemo } from "react";
import { INSTITUTION_PERMISSION_FIELDS } from "@/types/institution";
import { useGuestReadableFields } from "@/lib/hooks/useGuestReadableFields";

const permissionFields = new Set<string>(
	INSTITUTION_PERMISSION_FIELDS as readonly string[],
);

const permissionFieldAliasMap: Record<string, string> = {
	street: "address",
	street_number: "address",
	address_suffix: "address",
	zip: "address",
	zipcode: "address",
	city: "address",
	district: "address",
	neighbourhood: "address",
	cultural_area: "address",
	lat: "address",
	lng: "address",
	contact_person_name: "contact_person",
	contact_person_email: "contact_person",
	contact_person_phone: "contact_person",
	contact_person_surname: "contact_person",
	funding_source_name: "funding_sources",
	funding_source_description: "funding_sources",
	funding_source: "funding_sources",
	category: "categories",
	subcategory: "categories",
	subcategories: "categories",
};

const normalizePermissionField = (field: string | undefined): string | null => {
	if (!field) return null;
	const alias = permissionFieldAliasMap[field] ?? field;
	return permissionFields.has(alias) ? alias : null;
};

type PrivateFieldCandidate = {
	permissionField?: string;
	labelKey?: string;
	value?: unknown;
	id?: string;
	name?: string;
};

const resolvePermissionField = (
	field: PrivateFieldCandidate,
): string | null => {
	if (field.permissionField)
		return normalizePermissionField(field.permissionField);

	if (field.labelKey?.startsWith("field_names.")) {
		const key = field.labelKey.replace("field_names.", "");
		const normalized = normalizePermissionField(key);
		if (normalized) return normalized;
	}

	if (typeof field.value === "string") {
		const topLevelField = field.value.split(".")[0];
		const normalized = normalizePermissionField(topLevelField);
		if (normalized) return normalized;
	}

	if (field.id) {
		const normalized = normalizePermissionField(field.id);
		if (normalized) return normalized;
	}

	if (field.name) {
		const topLevelField = field.name.split(".")[0];
		const normalized = normalizePermissionField(topLevelField);
		if (normalized) return normalized;
	}

	return null;
};

export const useInstitutionPrivateFieldResolver = () => {
	const { fieldSet: guestReadableFieldSet, isLoading } =
		useGuestReadableFields("institution");

	const isPrivateField = useCallback(
		(field: PrivateFieldCandidate) => {
			if (isLoading) return false;
			const permissionField = resolvePermissionField(field);
			if (!permissionField) return false;
			return !guestReadableFieldSet.has(permissionField);
		},
		[guestReadableFieldSet, isLoading],
	);

	return useMemo(
		() => ({
			isPrivateField,
			isLoading,
		}),
		[isPrivateField, isLoading],
	);
};
