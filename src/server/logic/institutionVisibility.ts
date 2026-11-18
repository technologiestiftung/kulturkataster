import type { Prisma } from "@/generated/prisma";
import { buildInstitutionAccessWhere } from "@/server/logic/institutionAccess";
import {
	buildInstitutionSelectFromFields,
	getReadableInstitutionFields,
} from "@/server/logic/institutionSelect";
import {
	getGuestReadableFieldsForTable,
	getTableScope,
	type AccessContext,
} from "@/server/utils/rbac";
import type { Institution } from "@/types";

export const publicInstitutionStatusWhere: Prisma.InstitutionWhereInput = {
	status: { in: ["public", "private", "archived"] },
};

const relationFieldMap = {
	address: [
		"address_suffix",
		"zipcode",
		"city",
		"district",
		"neighbourhood",
		"cultural_area",
		"lat",
		"lng",
	],
	contact_person: ["first_name", "last_name", "email", "phone"],
} as const;

const uniqueFields = (...fieldLists: string[][]) =>
	Array.from(new Set(fieldLists.flat()));

const hasReadAccess = (fields: Set<string>, field: string) => fields.has(field);

const redactRelation = <
	T extends Record<string, unknown>,
	K extends keyof typeof relationFieldMap,
>(
	relation: T | null | undefined,
	relationName: K,
	allowedFields: Set<string>,
) => {
	if (!relation) return relation;
	const redacted: Record<string, unknown> = {};
	if ("id" in relation) redacted.id = relation.id;

	if (
		relationName === "address" &&
		hasReadAccess(allowedFields, "address.street")
	) {
		redacted.street = relation.street;
		redacted.street_number = relation.street_number;
	}

	for (const childField of relationFieldMap[relationName]) {
		const permissionField = `${relationName}.${childField}`;
		if (hasReadAccess(allowedFields, permissionField)) {
			redacted[childField] = relation[childField];
		}
	}

	return redacted;
};

export const redactInstitutionToFields = (
	institution: Institution,
	readableFields: string[],
): Institution => {
	const allowedFields = new Set(readableFields);
	const redacted: Record<string, unknown> = { id: institution.id };

	for (const field of readableFields) {
		if (field.includes(".")) continue;
		if (field === "subcategories") {
			redacted.categories = institution.categories;
			continue;
		}
		redacted[field] = institution[field as keyof Institution];
	}

	if (
		readableFields.some((field) => field.startsWith("address.")) &&
		institution.address
	) {
		redacted.address = redactRelation(
			institution.address as unknown as Record<string, unknown>,
			"address",
			allowedFields,
		);
	}

	if (
		readableFields.some((field) => field.startsWith("contact_person.")) &&
		institution.contact_person
	) {
		redacted.contact_person = redactRelation(
			institution.contact_person as unknown as Record<string, unknown>,
			"contact_person",
			allowedFields,
		);
	}

	return redacted as Institution;
};

export const buildVisibleInstitutionWhere = (
	scope: "own" | "all",
	userId: string | null,
	baseWhere?: Prisma.InstitutionWhereInput,
): Prisma.InstitutionWhereInput => {
	const visibleWhere: Prisma.InstitutionWhereInput =
		!userId || scope === "all"
			? publicInstitutionStatusWhere
			: {
					OR: [
						publicInstitutionStatusWhere,
						buildInstitutionAccessWhere(userId),
					],
				};

	return baseWhere ? { AND: [baseWhere, visibleWhere] } : visibleWhere;
};

export const loadInstitutionVisibility = async (
	ctx: AccessContext,
	userId: string | null,
) => {
	const guestReadableFields =
		await getGuestReadableFieldsForTable("institution");
	const userReadableFields = getReadableInstitutionFields(ctx);
	const readableFields = uniqueFields(guestReadableFields, userReadableFields);
	const select = buildInstitutionSelectFromFields(readableFields);
	const scope = getTableScope(ctx, "institution", "read");
	if (select && userId && scope === "own") {
		select.users = { select: { id: true } };
		select.groups = { select: { id: true, users: { select: { id: true } } } };
	}

	const isInternalInstitution = (institution: Institution) => {
		if (!userId) return false;
		if (scope === "all") return true;
		const directUserMatch = institution.users?.some(
			(user) => user.id === userId,
		);
		const groups = institution.groups as Array<{
			users?: Array<{ id: string }>;
		}> | null;
		const groupUserMatch = groups?.some((group) =>
			group.users?.some((user) => user.id === userId),
		);
		return Boolean(directUserMatch || groupUserMatch);
	};

	const redactInstitutions = (institutions: Institution[]) =>
		institutions.map((institution) =>
			isInternalInstitution(institution)
				? redactInstitutionToFields(institution, readableFields)
				: redactInstitutionToFields(institution, guestReadableFields),
		);

	return {
		scope,
		select,
		redactInstitutions,
	};
};
