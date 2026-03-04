"use server";

import {
	authorizeTable,
	getAccessContextForUser,
	requireAllScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { groupRepo } from "@/server/data/groupRepo";
import { revalidateAccount } from "../utils/actionsUtils";

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

export async function createGroup(input: GroupInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "create");
	requireAllScope(ctx, "group", "create");

	const group = await groupRepo.create(input);
	revalidateAccount();
	return group;
}

export async function updateGroup(input: GroupUpdateInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "update");
	requireAllScope(ctx, "group", "update");

	const group = await groupRepo.update(input.id, input);
	revalidateAccount();
	return group;
}

export async function deleteGroup(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "group", "delete");
	requireAllScope(ctx, "group", "delete");

	await groupRepo.remove(id);
	revalidateAccount();
	return { id };
}
