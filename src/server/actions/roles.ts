"use server";

import {
	getAccessContextForUser,
	authorizeTable,
	requireAllScope,
} from "@/server/utils/rbac";
import { roleRepo } from "@/server/data/roleRepo";
import { RoleInput, RoleUpdateInput } from "@/types";
import { getCurrentUserId } from "@/server/actions/auth";
import { revalidateAccount } from "../utils/actionsUtils";

export async function getRoles() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "read");
	requireAllScope(ctx, "role", "read");
	return roleRepo.list();
}

export async function getRoleById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "read");
	requireAllScope(ctx, "role", "read");
	return roleRepo.findById(id);
}

export async function createRole(input: RoleInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "create");
	requireAllScope(ctx, "role", "create");

	const role = await roleRepo.create(input);
	revalidateAccount();
	return role;
}

export async function updateRole(input: RoleUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "update");
	requireAllScope(ctx, "role", "update");

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
	requireAllScope(ctx, "role", "delete");
	const role = await roleRepo.findById(id);
	if (role?.is_system) {
		throw new Error("Cannot delete a system role");
	}

	await roleRepo.remove(id);
	revalidateAccount();
	return { id };
}
