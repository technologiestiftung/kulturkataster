"use server";

import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { userRepo } from "@/server/data/userRepo";

export async function getUsers() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "read");

	return userRepo.list();
}
