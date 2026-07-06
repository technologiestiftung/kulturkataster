"use server";

import {
	actionError,
	actionOk,
	getActionErrorCode,
	type ActionResult,
} from "@/lib/actions/actionResult";
import {
	getAccessContextForUser,
	authorizeTable,
	requireAllScope,
} from "@/server/utils/rbac";
import { roleRepo } from "@/server/data/roleRepo";
import { Role, RoleActionErrorCode, RoleInput, RoleUpdateInput } from "@/types";
import { getCurrentUserId } from "@/server/actions/auth";
import { revalidateAccount } from "../utils/actionsUtils";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "../logging/logger";

const classifyRoleActionError = (error: unknown): RoleActionErrorCode => {
	const errorCode = getActionErrorCode(error);
	if (errorCode === "P2002") return "nameTaken";
	if (errorCode === "P2025") return "notFound";
	if (error instanceof Error && error.name === "RBACError") {
		return "forbidden";
	}
	return "unexpected";
};

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

export async function getRoleFieldOrder(table: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "role", "read");
	requireAllScope(ctx, "role", "read");
	return roleRepo.getFieldOrder(table);
}

export async function createRole(
	input: RoleInput,
): Promise<ActionResult<Role, RoleActionErrorCode>> {
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
				return actionError(classifyRoleActionError(error));
			}
			revalidateAccount();
			return actionOk(role);
		},
		{ route: "server_action:roles.createRole" },
	);
}

export async function updateRole(
	input: RoleUpdateInput,
): Promise<ActionResult<Role, RoleActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "role", "update");
			requireAllScope(ctx, "role", "update");

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
				return actionError(classifyRoleActionError(error));
			}
			revalidateAccount();
			return actionOk(role);
		},
		{ route: "server_action:roles.updateRole" },
	);
}

export async function deleteRole(
	id: number,
): Promise<ActionResult<{ id: number }, RoleActionErrorCode>> {
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
				return actionError("systemRole");
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
				return actionError(classifyRoleActionError(error));
			}
			revalidateAccount();
			return actionOk({ id });
		},
		{ route: "server_action:roles.deleteRole" },
	);
}
