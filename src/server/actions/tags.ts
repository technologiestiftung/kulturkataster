"use server";

import { getCurrentUserId } from "@/server/actions/auth";
import { tagRepo } from "@/server/data/tagRepo";
import { authorizeFields, getAccessContextForUser } from "@/server/utils/rbac";

// Tags are managed through the institution "tags" field, so reading its options needs that field.
export async function getTags() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeFields(ctx, "institution", ["tags"], "read");
	return tagRepo.list();
}
