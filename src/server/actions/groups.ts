"use server";

import {
	actionError,
	actionOk,
	getActionErrorCode,
	type ActionResult,
} from "@/lib/actions/actionResult";
import {
	authorizeTable,
	getAccessContextForUser,
	requireAllScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { groupRepo } from "@/server/data/groupRepo";
import { revalidateAccount } from "../utils/actionsUtils";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "@/server/logging/logger";

export type GroupActionErrorCode =
	| "nameTaken"
	| "notFound"
	| "forbidden"
	| "unexpected";

const classifyGroupActionError = (error: unknown): GroupActionErrorCode => {
	const errorCode = getActionErrorCode(error);
	if (errorCode === "P2002") return "nameTaken";
	if (errorCode === "P2025") return "notFound";
	if (error instanceof Error && error.name === "RBACError") {
		return "forbidden";
	}
	return "unexpected";
};

export async function getGroups() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "read");
	requireAllScope(ctx, "group", "read");

	return groupRepo.list();
}

export async function getGroupById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "read");
	requireAllScope(ctx, "group", "read");

	return groupRepo.findById(id);
}

type GroupInput = {
	name: string;
	description?: string | null;
	userIds?: string[];
	institutionIds?: number[];
};

type GroupUpdateInput = GroupInput & { id: number };

export async function createGroup(
	input: GroupInput,
): Promise<ActionResult<Awaited<ReturnType<typeof groupRepo.create>>, GroupActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "group", "create");
			requireAllScope(ctx, "group", "create");

			let group;
			try {
				group = await groupRepo.create(input);
			} catch (error) {
				logger.error("group.create.db_failed", error, {
					subsystem: "group",
					db_subsystem: "db",
					actor_user_id: currentUserId,
				});
				return actionError(classifyGroupActionError(error));
			}
			revalidateAccount();
			return actionOk(group);
		},
		{ route: "server_action:groups.createGroup" },
	);
}

export async function updateGroup(
	input: GroupUpdateInput,
): Promise<ActionResult<Awaited<ReturnType<typeof groupRepo.update>>, GroupActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "group", "update");
			requireAllScope(ctx, "group", "update");

			let group;
			try {
				group = await groupRepo.update(input.id, input);
			} catch (error) {
				logger.error("group.update.db_failed", error, {
					subsystem: "group",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					group_id: input.id,
				});
				return actionError(classifyGroupActionError(error));
			}
			revalidateAccount();
			return actionOk(group);
		},
		{ route: "server_action:groups.updateGroup" },
	);
}

export async function deleteGroup(
	id: number,
): Promise<ActionResult<{ id: number }, GroupActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "group", "delete");
			requireAllScope(ctx, "group", "delete");

			try {
				await groupRepo.remove(id);
			} catch (error) {
				logger.error("group.delete.db_failed", error, {
					subsystem: "group",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					group_id: id,
				});
				return actionError(classifyGroupActionError(error));
			}
			revalidateAccount();
			return actionOk({ id });
		},
		{ route: "server_action:groups.deleteGroup" },
	);
}
