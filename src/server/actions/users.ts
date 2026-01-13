"use server";

import {
	authorizeFields,
	authorizeTable,
	getAccessContextForUser,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { userRepo } from "@/server/data/userRepo";
import { createAdminClient } from "@/server/supabase/server";
import type { UserFormInput } from "@/types/user";

const getUserFields = (input: UserFormInput) => {
	const fields: string[] = ["email"];
	if (typeof input.status !== "undefined") fields.push("status");
	if (typeof input.compliance !== "undefined") fields.push("compliance");
	if (typeof input.institution_claims !== "undefined")
		fields.push("institution_claims");
	if (typeof input.account_type !== "undefined") fields.push("account_type");
	if (typeof input.roleId !== "undefined") fields.push("role");
	if (input.groupIds) fields.push("groups");
	if (input.institutionIds) fields.push("institutions");
	return fields;
};

export async function getUsers() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "read");

	return userRepo.list();
}

export async function getUserById(id: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "read");
	return userRepo.findById(id);
}

export async function createUser(input: UserFormInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "create");

	const supabase = createAdminClient();
	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	const { data, error } = await supabase.auth.admin.inviteUserByEmail(
		input.email,
		{
			redirectTo: `${siteUrl}/account/reset-password`,
		},
	);

	if (error || !data.user) {
		throw new Error(error?.message || "Failed to create auth user.");
	}

	return userRepo.create({
		id: data.user.id,
		email: input.email,
		first_name: input.first_name ?? undefined,
		last_name: input.last_name ?? undefined,
		status: input.status ?? undefined,
		compliance: input.compliance ?? undefined,
		institution_claims: input.institution_claims ?? undefined,
		account_type: input.account_type ?? undefined,
		role: input.roleId ? { connect: { id: input.roleId } } : undefined,
		groups: input.groupIds
			? { connect: input.groupIds.map((id) => ({ id })) }
			: undefined,
		institutions: input.institutionIds
			? { connect: input.institutionIds.map((id) => ({ id })) }
			: undefined,
	});
}

export async function updateUser(input: UserFormInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const fields = getUserFields(input);
	authorizeTable(ctx, "user", "update");
	authorizeFields(ctx, "user", fields, "update");

	if (!input.id) {
		throw new Error("User id is required for update.");
	}

	const supabase = createAdminClient();
	const authPayload: {
		email?: string;
		banDuration?: string;
	} = {
		email: input.email,
	};

	if (input.status === "banned") {
		authPayload.banDuration = "876000h";
	} else if (input.status === "active") {
		authPayload.banDuration = "0s";
	}

	const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
		input.id,
		authPayload,
	);

	if (authUpdateError) {
		throw new Error(authUpdateError.message);
	}

	return userRepo.update(input.id, {
		email: input.email,
		first_name: input.first_name ?? undefined,
		last_name: input.last_name ?? undefined,
		status: input.status ?? undefined,
		compliance: input.compliance ?? undefined,
		institution_claims: input.institution_claims ?? undefined,
		account_type: input.account_type ?? undefined,
		role: input.roleId ? { connect: { id: input.roleId } } : undefined,
		groups: input.groupIds
			? { set: input.groupIds.map((id) => ({ id })) }
			: undefined,
		institutions: input.institutionIds
			? { set: input.institutionIds.map((id) => ({ id })) }
			: undefined,
	});
}

export async function removeUser(id: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "delete");

	const supabase = createAdminClient();
	const { error } = await supabase.auth.admin.deleteUser(id);
	if (error) {
		throw new Error(error.message);
	}

	return userRepo.remove(id);
}

export async function sendPasswordReset(email: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "update");

	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	const supabase = createAdminClient();
	const { error } = await supabase.auth.admin.generateLink({
		type: "recovery",
		email,
		options: {
			redirectTo: `${siteUrl}/account/reset-password`,
		},
	});

	if (error) {
		throw new Error(error.message);
	}

	return { ok: true };
}
