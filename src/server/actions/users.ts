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
	getTableScope,
	requireAllScope,
} from "@/server/utils/rbac";
import { getCurrentUserId, requestPasswordReset } from "@/server/actions/auth";
import { userRepo } from "@/server/data/userRepo";
import { createAdminClient, createClient } from "@/server/supabase/server";
import type { UserFormInput } from "@/types/user";
import type { User } from "@/types/user";
import { revalidateAccount } from "../utils/actionsUtils";
import { requireScopeOrUser } from "@/server/utils/rbac";
import {
	RoleEmailDecision,
	RoleEmailTarget,
	sendAccountDeletedEmail,
	sendComplianceResendEmail,
	sendRoleDecisionEmail,
	sendRoleDecisionEmailIfNeeded,
} from "@/server/email/dispatcher";
import { logger } from "@/server/logging/logger";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";

export type UserActionErrorCode =
	| "emailTaken"
	| "notFound"
	| "forbidden"
	| "invalidInput"
	| "unexpected";

const classifyUserActionError = (error: unknown): UserActionErrorCode => {
	const errorCode = getActionErrorCode(error);
	if (errorCode === "P2002") return "emailTaken";
	if (errorCode === "P2025") return "notFound";
	if (error instanceof Error && error.name === "RBACError") {
		return "forbidden";
	}
	return "unexpected";
};

const buildMirroredUserMetadata = (
	existingMetadata: unknown,
	firstName: string | null | undefined,
	lastName: string | null | undefined,
) => {
	const base =
		existingMetadata && typeof existingMetadata === "object"
			? (existingMetadata as Record<string, unknown>)
			: {};

	return {
		...base,
		first_name: firstName ?? null,
		last_name: lastName ?? null,
	};
};

const syncAuthUserMetadataAsAdmin = async (
	userId: string,
	user: {
		first_name?: string | null;
		last_name?: string | null;
	},
) => {
	const supabase = createAdminClient();
	const { data: authUserData, error: getAuthUserError } =
		await supabase.auth.admin.getUserById(userId);
	if (getAuthUserError) {
		throw new Error(getAuthUserError.message);
	}

	const metadata = buildMirroredUserMetadata(
		authUserData.user?.user_metadata,
		user.first_name,
		user.last_name,
	);
	const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
		userId,
		{
			user_metadata: metadata,
		},
	);
	if (updateAuthError) {
		throw new Error(updateAuthError.message);
	}
};

const syncAuthUserMetadataAsCurrentUser = async (user: {
	first_name?: string | null;
	last_name?: string | null;
}) => {
	const supabase = await createClient();
	const {
		data: { user: authUser },
		error: getAuthUserError,
	} = await supabase.auth.getUser();
	if (getAuthUserError) {
		throw new Error(getAuthUserError.message);
	}

	const metadata = buildMirroredUserMetadata(
		authUser?.user_metadata,
		user.first_name,
		user.last_name,
	);
	const { error: updateAuthError } = await supabase.auth.updateUser({
		data: metadata,
	});
	if (updateAuthError) {
		throw new Error(updateAuthError.message);
	}
};

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

export async function createUser(
	input: UserFormInput,
): Promise<ActionResult<User, UserActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "user", "create");
			requireAllScope(ctx, "user", "create");

			const supabase = createAdminClient();
			const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
			const { data, error } = await supabase.auth.admin.inviteUserByEmail(
				input.email,
				{
					redirectTo: `${siteUrl}/resetPassword`,
				},
			);

			if (error || !data.user) {
				logger.error("user.create.auth_invite_failed", error, {
					subsystem: "auth",
					actor_user_id: currentUserId,
					email: input.email,
				});
				return actionError("unexpected");
			}

			let user;
			try {
				user = await userRepo.create({
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
			} catch (dbError) {
				logger.error("user.create.db_failed", dbError, {
					subsystem: "user",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					target_user_id: data.user.id,
					email: input.email,
				});
				return actionError(classifyUserActionError(dbError));
			}
			await syncAuthUserMetadataAsAdmin(user.id, {
				first_name: user.first_name,
				last_name: user.last_name,
			});
			revalidateAccount();
			return actionOk(user);
		},
		{ route: "server_action:users.createUser" },
	);
}

export async function updateUser(
	input: UserFormInput,
): Promise<ActionResult<User, UserActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "user", "update");
			const scope = getTableScope(ctx, "user", "update");

			if (!input.id) {
				return actionError("invalidInput");
			}

			if (scope !== "all") {
				const ownerId = requireScopeOrUser(scope, currentUserId);
				if (!ownerId || input.id !== ownerId) {
					return actionError("forbidden");
				}
				if (
					typeof input.status !== "undefined" ||
					typeof input.compliance !== "undefined" ||
					typeof input.roleId !== "undefined" ||
					typeof input.groupIds !== "undefined" ||
					typeof input.institutionIds !== "undefined"
				) {
					return actionError("forbidden");
				}

				const supabase = await createClient();
				if (input.email) {
					const { error: authUpdateError } = await supabase.auth.updateUser({
						email: input.email,
					});
					if (authUpdateError) {
						logger.error("user.update.self_auth_failed", authUpdateError, {
							subsystem: "auth",
							actor_user_id: currentUserId,
							target_user_id: input.id,
						});
						return actionError("unexpected");
					}
				}

				let user;
				try {
					user = await userRepo.update(input.id, {
						email: input.email,
						first_name: input.first_name ?? undefined,
						last_name: input.last_name ?? undefined,
						account_type: input.account_type ?? undefined,
						meta_info: input.meta_info ?? undefined,
					});
				} catch (error) {
					logger.error("user.update.db_failed", error, {
						subsystem: "user",
						db_subsystem: "db",
						actor_user_id: currentUserId,
						target_user_id: input.id,
					});
					return actionError(classifyUserActionError(error));
				}
				await syncAuthUserMetadataAsCurrentUser({
					first_name: user.first_name,
					last_name: user.last_name,
				});
				revalidateAccount();
				return actionOk(user);
			}

			const supabase = createAdminClient();
			const existingUser = await userRepo.findById(input.id);
			if (!existingUser) {
				return actionError("notFound");
			}

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

			const { error: authUpdateError } =
				await supabase.auth.admin.updateUserById(input.id, authPayload);

			if (authUpdateError) {
				logger.error("user.update.admin_auth_failed", authUpdateError, {
					subsystem: "auth",
					actor_user_id: currentUserId,
					target_user_id: input.id,
				});
				return actionError("unexpected");
			}

			let user;
			try {
				user = await userRepo.update(input.id, {
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
			} catch (error) {
				logger.error("user.update.db_failed", error, {
					subsystem: "user",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					target_user_id: input.id,
				});
				return actionError(classifyUserActionError(error));
			}
			await syncAuthUserMetadataAsAdmin(user.id, {
				first_name: user.first_name,
				last_name: user.last_name,
			});

			await sendRoleDecisionEmailIfNeeded({
				beforeStatus: existingUser.status,
				afterStatus: user.status,
				accountType: user.account_type,
				email: user.email,
				firstName: user.first_name,
				lastName: user.last_name,
				metaInfo: user.meta_info,
			});
			revalidateAccount();
			return actionOk(user);
		},
		{ route: "server_action:users.updateUser" },
	);
}

export async function deleteUser(
	id: string,
): Promise<ActionResult<{ id: string }, UserActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "user", "delete");
			const scope = getTableScope(ctx, "user", "delete");
			if (scope !== "all") {
				const ownerId = requireScopeOrUser(scope, currentUserId);
				if (!ownerId || id !== ownerId) {
					return actionError("forbidden");
				}
			}

			const existingUser = await userRepo.findById(id);
			const supabase = createAdminClient();
			const { error } = await supabase.auth.admin.deleteUser(id);
			if (error) {
				logger.error("user.delete.auth_failed", error, {
					subsystem: "auth",
					actor_user_id: currentUserId,
					target_user_id: id,
				});
				return actionError("unexpected");
			}

			try {
				await userRepo.remove(id);
			} catch (dbError) {
				logger.error("user.delete.db_failed", dbError, {
					subsystem: "user",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					target_user_id: id,
				});
				return actionError(classifyUserActionError(dbError));
			}
			if (existingUser?.email) {
				await sendAccountDeletedEmail({
					email: existingUser.email,
					firstName: existingUser.first_name,
					lastName: existingUser.last_name,
				});
			}
			revalidateAccount();
			return actionOk({ id });
		},
		{ route: "server_action:users.deleteUser" },
	);
}

export async function sendPasswordReset(
	email: string,
): Promise<ActionResult<{ ok: true }, UserActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "user", "update");
			requireAllScope(ctx, "user", "update");

			try {
				const result = await requestPasswordReset(email);
				if (!result.ok) {
					logger.error(
						"user.password_reset.request_failed",
						new Error(result.error ?? "Failed to send password reset email."),
						{
							subsystem: "auth",
							actor_user_id: currentUserId,
							email,
						},
					);
					return actionError("unexpected");
				}

				return actionOk({ ok: true as const });
			} catch (error) {
				logger.error("user.password_reset.unexpected_failed", error, {
					subsystem: "auth",
					actor_user_id: currentUserId,
					email,
				});
				return actionError("unexpected");
			}
		},
		{ route: "server_action:users.sendPasswordReset" },
	);
}

export async function sendComplianceResend(
	email: string,
): Promise<ActionResult<{ ok: true }, UserActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "user", "update");
			requireAllScope(ctx, "user", "update");

			try {
				const matchedUsers = await userRepo.search(
					{ email: { equals: email } },
					1,
				);
				const matchedUser = matchedUsers[0];
				await sendComplianceResendEmail({
					email,
					firstName: matchedUser?.first_name,
					lastName: matchedUser?.last_name,
				});

				return actionOk({ ok: true as const });
			} catch (error) {
				logger.error("user.compliance_resend.failed", error, {
					subsystem: "auth",
					actor_user_id: currentUserId,
					email,
				});
				return actionError("unexpected");
			}
		},
		{ route: "server_action:users.sendComplianceResend" },
	);
}

export async function sendRoleDecisionEmailManual(input: {
	userId: string;
	target: RoleEmailTarget;
	decision: RoleEmailDecision;
}): Promise<ActionResult<User, UserActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "user", "update");
			requireAllScope(ctx, "user", "update");

			const user = await userRepo.findById(input.userId);
			if (!user) {
				return actionError("notFound");
			}

			try {
				await sendRoleDecisionEmail({
					target: input.target,
					decision: input.decision,
					email: user.email,
					firstName: user.first_name,
					lastName: user.last_name,
					metaInfo: user.meta_info,
				});
			} catch (error) {
				logger.error("user.role_decision.email_failed", error, {
					subsystem: "auth",
					actor_user_id: currentUserId,
					target_user_id: user.id,
					decision: input.decision,
					target: input.target,
				});
				return actionError("unexpected");
			}

			if (input.decision === "approved" && user.status !== "active") {
					try {
						const updatedUser = await userRepo.update(user.id, {
							status: "active",
						});
						revalidateAccount();
						return actionOk(updatedUser);
					} catch (error) {
					logger.error("user.role_decision.status_update_failed", error, {
						subsystem: "user",
						db_subsystem: "db",
						actor_user_id: currentUserId,
						target_user_id: user.id,
						decision: input.decision,
						target: input.target,
					});
					return actionError(classifyUserActionError(error));
				}
			}

			revalidateAccount();
			return actionOk(user);
		},
		{ route: "server_action:users.sendRoleDecisionEmailManual" },
	);
}
