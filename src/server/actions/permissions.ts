"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { prisma } from "@/server/prisma";
import {
	getAccessContextForUser,
	getFieldPermissionListsForTable,
	getTableScope,
} from "@/server/utils/rbac";
import {
	getGuestDownloadableFieldsForTable,
	getGuestReadableFieldsForTable,
} from "@/server/utils/rbac";

type DownloadReadableFieldsResult = {
	readableFields: string[];
	guestReadableFields: string[];
	columnFields: string[];
	audience: "guest" | "internal";
	internalInstitutionIds: number[] | null;
};

const mergeOrderedFields = (
	fieldOrder: Record<string, number>,
	...fieldLists: string[][]
) => {
	const merged: string[] = [];
	fieldLists.flat().forEach((field) => {
		if (!merged.includes(field)) {
			merged.push(field);
		}
	});
	return merged.sort(
		(left, right) =>
			(fieldOrder[left] ?? Number.MAX_SAFE_INTEGER) -
				(fieldOrder[right] ?? Number.MAX_SAFE_INTEGER) ||
			left.localeCompare(right),
	);
};

export async function getGuestReadableFields(table: string): Promise<string[]> {
	if (!table || table.trim().length === 0) return [];
	return getGuestReadableFieldsForTable(table);
}

async function getInternalInstitutionIdsForDownload(
	userId: string,
	scope: "own" | "all",
	institutionIds: number[],
): Promise<number[] | null> {
	if (scope === "all") return null;
	if (institutionIds.length === 0) return [];

	const where = buildInstitutionScopedWhere(scope, userId, {
		id: { in: institutionIds },
	});
	const institutions = await prisma.institution.findMany({
		where,
		select: { id: true },
	});
	return institutions.map((institution) => institution.id);
}

export async function getDownloadReadableFields(
	table: string,
	institutionIds: number[] = [],
): Promise<DownloadReadableFieldsResult> {
	if (!table || table.trim().length === 0) {
		return {
			readableFields: [],
			guestReadableFields: [],
			columnFields: [],
			audience: "guest",
			internalInstitutionIds: [],
		};
	}

	const guestReadableFields = await getGuestDownloadableFieldsForTable(table);
	const userId = await getCurrentUserId();
	if (!userId) {
		return {
			readableFields: guestReadableFields,
			guestReadableFields,
			columnFields: guestReadableFields,
			audience: "guest",
			internalInstitutionIds: [],
		};
	}

	const ctx = await getAccessContextForUser(userId);
	const scope = getTableScope(ctx, table, "read");
	const readableFields = getFieldPermissionListsForTable(ctx, table).download;
	const columnFields = mergeOrderedFields(
		ctx.fieldOrder[table] ?? {},
		readableFields,
		guestReadableFields,
	);
	return {
		readableFields,
		guestReadableFields,
		columnFields,
		audience: "internal",
		internalInstitutionIds:
			table === "institution"
				? await getInternalInstitutionIdsForDownload(
						userId,
						scope,
						institutionIds,
					)
				: null,
	};
}
