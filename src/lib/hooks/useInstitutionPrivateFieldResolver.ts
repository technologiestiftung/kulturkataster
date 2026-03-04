"use client";

import { useCallback, useMemo } from "react";
import { useGuestReadableFields } from "@/lib/hooks/useGuestReadableFields";
import {
	resolveInstitutionPermissionField,
	type InstitutionPermissionFieldCandidate,
} from "@/lib/utils/institutionPermissionField";

export const useInstitutionPrivateFieldResolver = () => {
	const { fieldSet: guestReadableFieldSet, isLoading } =
		useGuestReadableFields("institution");

	const isPrivateField = useCallback(
		(field: InstitutionPermissionFieldCandidate) => {
			if (isLoading) return false;
			const permissionField = resolveInstitutionPermissionField(field);
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
