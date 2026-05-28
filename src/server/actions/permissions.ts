"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import {
	getAccessContextForUser,
	getFieldPermissionListsForTable,
} from "@/server/utils/rbac";
import { getGuestReadableFieldsForTable } from "@/server/utils/rbac";

export async function getGuestReadableFields(table: string): Promise<string[]> {
	if (!table || table.trim().length === 0) return [];
	return getGuestReadableFieldsForTable(table);
}

export async function getDownloadReadableFields(table: string): Promise<{
	readableFields: string[];
	audience: "guest" | "internal";
}> {
	if (!table || table.trim().length === 0) {
		return { readableFields: [], audience: "guest" };
	}

	const userId = await getCurrentUserId();
	if (!userId) {
		return {
			readableFields: await getGuestReadableFieldsForTable(table),
			audience: "guest",
		};
	}

	const ctx = await getAccessContextForUser(userId);
	return {
		readableFields: getFieldPermissionListsForTable(ctx, table).read,
		audience: "internal",
	};
}
