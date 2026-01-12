"use server";

import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { groupRepo } from "@/server/data/groupRepo";

export async function getGroups() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "read");

	return groupRepo.list();
}

type GroupInput = {
	name: string;
	description?: string | null;
	userIds?: string[];
	institutionIds?: number[];
};

type GroupUpdateInput = GroupInput & { id: number };

export async function createGroup(input: GroupInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "create");

	return groupRepo.create(input);
}

export async function updateGroup(input: GroupUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "update");

	return groupRepo.update(input.id, input);
}

export async function deleteGroup(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "delete");

	return groupRepo.remove(id);
}
