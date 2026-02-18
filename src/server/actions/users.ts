"use server";

import {
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
	requireAllScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { userRepo } from "@/server/data/userRepo";
import { createAdminClient, createClient } from "@/server/supabase/server";
import type { UserFormInput } from "@/types/user";
import { revalidateAccount } from "../utils/actionsUtils";
import { requireScopeOrUser } from "@/server/utils/rbac";

export async function getUsers() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "read");

	const scope = getTableScope(ctx, "user", "read");
	if (scope === "all") {
		const list = await userRepo.list();
		return list;
	}
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) return [];
	const user = await userRepo.findById(ownerId);
	return user ? [user] : [];
}

export async function getUserById(id: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "read");
	const scope = getTableScope(ctx, "user", "read");
	if (scope === "all") {
		return userRepo.findById(id);
	}
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId || id !== ownerId) {
		throw new Error("Not authorized to read this user.");
	}
	return userRepo.findById(id);
}

export async function createUser(input: UserFormInput) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "create");
	requireAllScope(ctx, "user", "create");

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
		meta_info: input.meta_info ?? undefined,
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
	const scope = getTableScope(ctx, "user", "update");

	if (!input.id) {
		throw new Error("User id is required for update.");
	}

	if (scope !== "all") {
		const ownerId = requireScopeOrUser(scope, currentUserId);
		if (!ownerId || input.id !== ownerId) {
			throw new Error("Not authorized to update this user.");
		}
		if (
			typeof input.status !== "undefined" ||
			typeof input.compliance !== "undefined" ||
			typeof input.roleId !== "undefined" ||
			typeof input.groupIds !== "undefined" ||
			typeof input.institutionIds !== "undefined"
		) {
			throw new Error("Not authorized to update restricted user fields.");
		}

		const supabase = await createClient();
		if (input.email) {
			const { error: authUpdateError } = await supabase.auth.updateUser({
				email: input.email,
			});
			if (authUpdateError) {
				throw new Error(authUpdateError.message);
			}
		}

		const user = await userRepo.update(input.id, {
			email: input.email,
			first_name: input.first_name ?? undefined,
			last_name: input.last_name ?? undefined,
			account_type: input.account_type ?? undefined,
			meta_info: input.meta_info ?? undefined,
		});
		revalidateAccount();
		return user;
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
		meta_info: input.meta_info ?? undefined,
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

export async function deleteUser(id: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "delete");
	const scope = getTableScope(ctx, "user", "delete");
	if (scope !== "all") {
		const ownerId = requireScopeOrUser(scope, currentUserId);
		if (!ownerId || id !== ownerId) {
			throw new Error("Not authorized to delete users.");
		}
	}

	const supabase = createAdminClient();
	const { error } = await supabase.auth.admin.deleteUser(id);
	if (error) {
		throw new Error(error.message);
	}

	await userRepo.remove(id);
	revalidateAccount();
	return { id };
}

export async function sendPasswordReset(email: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "user", "update");
	requireAllScope(ctx, "user", "update");

	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	const supabase = createAdminClient();
	console.log(
		`Generating password reset link for ${email} with redirect to ${siteUrl}/reset-password`,
	);
	const { error, data } = await supabase.auth.admin.generateLink({
		type: "recovery",
		email,
		options: {
			redirectTo: `${siteUrl}/reset-password`,
		},
	});

	if (error) {
		throw new Error(error.message);
	}

	return { data };
}

export async function sendComplianceResend(email: string): Promise<void> {
	// To be implemented
	console.log(`Resend compliance email to ${email} - Not yet implemented.`);
	return;
}
