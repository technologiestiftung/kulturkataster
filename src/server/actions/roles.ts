"use server";

import { getAccessContextForUser, authorizeTable } from "@/server/utils/rbac";
import { roleRepo } from "@/server/data/roleRepo";
import { RoleInput, RoleUpdateInput } from "@/types";
import { getCurrentUserId } from "../auth/getCurrentUser";
import { revalidateAccount } from "../utils/actionsUtils";

export async function getRoles() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "read");
	return roleRepo.list();
}

export async function getRoleById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "read");
	return roleRepo.findById(id);
}

export async function createRole(input: RoleInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "create");

	const role = await roleRepo.create(input);
	revalidateAccount();
	return role;
}

export async function updateRole(input: RoleUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "update");

	const existingRole = await roleRepo.findById(input.id);
	if (existingRole?.is_system) {
		const { tablePermissions: _tablePermissions, ...rest } = input;
		const role = await roleRepo.update(input.id, rest);
		revalidateAccount();
		return role;
	}

	const role = await roleRepo.update(input.id, input);
	revalidateAccount();
	return role;
}

export async function deleteRole(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "delete");
	const role = await roleRepo.findById(id);
	if (role?.is_system) {
		throw new Error("Cannot delete a system role");
	}

	const deletedRole = await roleRepo.remove(id);
	revalidateAccount();
	return deletedRole;
}
