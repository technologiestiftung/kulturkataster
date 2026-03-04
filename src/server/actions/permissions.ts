"use server";

import { getGuestReadableFieldsForTable } from "@/server/utils/rbac";

export async function getGuestReadableFields(table: string): Promise<string[]> {
	if (!table || table.trim().length === 0) return [];
	return getGuestReadableFieldsForTable(table);
}
