"use server";

import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { groupRepo } from "@/server/data/groupRepo";

export async function getGroups() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "groups", "read");

	return groupRepo.list();
}

type GroupInput = {
	name: string;
	description?: string | null;
	userIds?: string[];
	institutionIds?: number[];
};

type GroupUpdateInput = GroupInput & { id: number };

const getGroupFieldList = (input: GroupInput) => {
	const fields: string[] = ["name"];
	if (typeof input.description !== "undefined") fields.push("description");
	if (input.userIds) fields.push("users");
	if (input.institutionIds) fields.push("institutions");
	return fields;
};

export async function createGroup(input: GroupInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "groups", "create");

	return groupRepo.create(input);
}

export async function updateGroup(input: GroupUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "groups", "update");

	return groupRepo.update(input.id, input);
}

export async function deleteGroup(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "groups", "delete");

	return groupRepo.remove(id);
}
