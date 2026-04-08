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
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "../logging/logger";

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
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "role", "create");
			requireAllScope(ctx, "role", "create");

			let role;
			try {
				role = await roleRepo.create(input);
			} catch (error) {
				logger.error("role.create.db_failed", error, {
					subsystem: "rbac",
					db_subsystem: "db",
					actor_user_id: currentUserId,
				});
				throw error;
			}
			revalidateAccount();
			return role;
		},
		{ route: "server_action:roles.createRole" },
	);
}

export async function updateRole(input: RoleUpdateInput) {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "role", "update");
			requireAllScope(ctx, "role", "update");

			const existingRole = await roleRepo.findById(input.id);
			if (existingRole?.is_system) {
				const { tablePermissions: _tablePermissions, ...rest } = input;
				let role;
				try {
					role = await roleRepo.update(input.id, rest);
				} catch (error) {
					logger.error("role.update.db_failed", error, {
						subsystem: "rbac",
						db_subsystem: "db",
						actor_user_id: currentUserId,
						role_id: input.id,
					});
					throw error;
				}
				revalidateAccount();
				return role;
			}

			let role;
			try {
				role = await roleRepo.update(input.id, input);
			} catch (error) {
				logger.error("role.update.db_failed", error, {
					subsystem: "rbac",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					role_id: input.id,
				});
				throw error;
			}
			revalidateAccount();
			return role;
		},
		{ route: "server_action:roles.updateRole" },
	);
}

export async function deleteRole(id: number) {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "role", "delete");
			requireAllScope(ctx, "role", "delete");
			const role = await roleRepo.findById(id);
			if (role?.is_system) {
				logger.warn("role.delete.system_blocked", {
					subsystem: "rbac",
					actor_user_id: currentUserId,
					role_id: id,
					role_name: role.name,
				});
				throw new Error("Cannot delete a system role");
			}

			try {
				await roleRepo.remove(id);
			} catch (error) {
				logger.error("role.delete.db_failed", error, {
					subsystem: "rbac",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					role_id: id,
				});
				throw error;
			}
			revalidateAccount();
			return { id };
		},
		{ route: "server_action:roles.deleteRole" },
	);
}
