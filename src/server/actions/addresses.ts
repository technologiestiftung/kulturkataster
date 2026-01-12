"use server";

import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { addressRepo } from "@/server/data/addressRepo";

export async function getDistricts(): Promise<string[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "address", "read");

	const districts = await addressRepo.listDistinct();
	return districts
		.map((row) => row.district)
		.filter((district): district is string => !!district);
}
