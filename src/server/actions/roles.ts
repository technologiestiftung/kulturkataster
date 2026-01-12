"use server";

import { getAccessContextForUser, authorizeTable } from "@/server/utils/rbac";
import { roleRepo } from "@/server/data/roleRepo";
import { RoleInput, RoleUpdateInput } from "@/types";
import { getCurrentUserId } from "../auth/getCurrentUser";

export async function getRoles() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "read");
	return roleRepo.list();
}

export async function createRole(input: RoleInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "create");

	return roleRepo.create(input);
}

export async function updateRole(input: RoleUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "update");

	return roleRepo.update(input.id, input);
}

export async function deleteRole(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "delete");

	return roleRepo.remove(id);
}
