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

const getRoleFieldList = (input: RoleInput | RoleUpdateInput) => {
	const fields: string[] = ["name"];
	if (typeof input.description !== "undefined") fields.push("description");
	if (typeof input.permissions !== "undefined") fields.push("permissions");
	if (input.fieldPermissions) fields.push("field_permissions");
	return fields;
};

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
