"use server";

import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { userRepo } from "@/server/data/userRepo";
import { createAdminClient } from "@/server/supabase/server";
import type { UserFormInput } from "@/types/user";
import { revalidateAccount } from "../utils/actionsUtils";

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
			redirectTo: `${siteUrl}/reset-password`,
		},
	);

	if (error || !data.user) {
		throw new Error(error?.message || "Failed to create auth user.");
	}

	const user = await userRepo.create({
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
	revalidateAccount();
	return user;
}

export async function updateUser(input: UserFormInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "update");

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

	const user = await userRepo.update(input.id, {
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
	revalidateAccount();
	return user;
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

	const user = await userRepo.remove(id);
	revalidateAccount();
	return user;
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
			redirectTo: `${siteUrl}/reset-password`,
		},
	});

	if (error) {
		throw new Error(error.message);
	}

	return { ok: true };
}

export async function sendComplianceResend(email: string): Promise<void> {
	// To be implemented
	console.log(`Resend compliance email to ${email} - Not yet implemented.`);
	return;
}
