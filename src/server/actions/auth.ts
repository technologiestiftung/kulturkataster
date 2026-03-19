"use server";

import { createAnonClient, createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";
import { logger } from "@/server/logging/logger";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";

export async function getSession() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getSession();

	if (error) {
		return null;
	}

	return data.session;
}

export async function getCurrentUser() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) return null;
	return user;
}

export async function getCurrentProfile() {
	const user = await getCurrentUser();
	if (!user) return null;

	let profile;
	try {
		profile = await prisma.user.findUnique({
			where: { id: user.id },
		});
	} catch (error) {
		logger.error("auth.get_current_profile.db_failed", error, {
			subsystem: "auth",
			db_subsystem: "db",
			target_user_id: user.id,
		});
		throw error;
	}

	return profile;
}

export async function getCurrentUserId() {
	const user = await getCurrentUser();
	return user?.id ?? null;
}

export async function loginWithEmailPassword(email: string, password: string) {
	return runWithServerRequestContext(
		async () => {
			const supabase = await createClient();
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error || !data.user?.id) {
				return { ok: false, error: "invalid_credentials" as const };
			}

			const userId = data.user.id;
			setRequestContext({ userId });
			let profile;
			try {
				profile = await prisma.user.findUnique({
					where: { id: userId },
				});
			} catch (dbError) {
				logger.error("auth.login.profile_lookup_failed", dbError, {
					subsystem: "auth",
					db_subsystem: "db",
					target_user_id: userId,
				});
				throw dbError;
			}
			if (!profile) {
				await supabase.auth.signOut();
				return { ok: false, error: "invalid_credentials" as const };
			}
			if (profile.status === "banned") {
				await supabase.auth.signOut();
				return { ok: false, error: "banned" as const };
			}

			return {
				ok: true as const,
				approvalPending: profile.status === "approval_pending",
			};
		},
		{ route: "server_action:auth.loginWithEmailPassword" },
	);
}

export async function logout() {
	const supabase = await createClient();
	const { error } = await supabase.auth.signOut();

	if (error) {
		return { ok: false, error: error.message };
	}

	return { ok: true };
}

export async function registerWithEmailPassword(params: {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	accountType?: string;
	organizationName?: string;
	organizationPosition?: string;
	organizationPhone?: string;
	districtName?: string;
	districtOffice?: string;
	districtPosition?: string;
	districtPhone?: string;
	administrationName?: string;
	administrationPosition?: string;
	administrationPhone?: string;
}) {
	return runWithServerRequestContext(
		async () => {
			const buildMetaInfo = () => {
				if (params.accountType === "organization") {
					return {
						organizationName: params.organizationName ?? "",
						organizationPosition: params.organizationPosition ?? "",
						organizationPhone: params.organizationPhone ?? "",
					};
				}
				if (params.accountType === "district") {
					return {
						districtName: params.districtName ?? "",
						districtOffice: params.districtOffice ?? "",
						districtPosition: params.districtPosition ?? "",
						districtPhone: params.districtPhone ?? "",
					};
				}
				if (params.accountType === "administration") {
					return {
						administrationName: params.administrationName ?? "",
						administrationPosition: params.administrationPosition ?? "",
						administrationPhone: params.administrationPhone ?? "",
					};
				}
				return {};
			};

			const looksLikeAlreadyRegisteredError = (message: string) => {
				const msg = message.toLowerCase();
				return (
					msg.includes("already") ||
					msg.includes("exists") ||
					msg.includes("registered") ||
					(msg.includes("user") && msg.includes("already"))
				);
			};

			const ensureAppUserIfMissing = async (userId: string, email: string) => {
				const existing = await prisma.user.findUnique({
					where: { id: userId },
					select: { id: true },
				});
				if (existing) return;

				const guestRole = await prisma.role.findUnique({
					where: { name: "guest" },
					select: { id: true },
				});
				const metaInfo = buildMetaInfo();
				await prisma.user.create({
					data: {
						id: userId,
						email,
						first_name: params.firstName ?? null,
						last_name: params.lastName ?? null,
						account_type: params.accountType ?? null,
						role: guestRole ? { connect: { id: guestRole.id } } : undefined,
						meta_info: Object.keys(metaInfo).length > 0 ? metaInfo : undefined,
						status: "approval_pending",
					},
				});
			};

			const supabase = await createClient();

			const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
			const { data, error } = await supabase.auth.signUp({
				email: params.email,
				password: params.password,
				options: {
					emailRedirectTo: `${siteUrl}/login`,
					data: {
						first_name: params.firstName ?? null,
						last_name: params.lastName ?? null,
					},
				},
			});

			if (error) {
				if (looksLikeAlreadyRegisteredError(error.message ?? "")) {
					return { ok: true, needsConfirmation: true };
				}
				logger.error("auth.register.sign_up_failed", error, {
					subsystem: "auth",
					email: params.email,
					account_type: params.accountType ?? null,
				});
				return { ok: false, error: "Registration currently unavailable." };
			}

			if (!data.user?.id) {
				return { ok: true, needsConfirmation: true };
			}

			try {
				setRequestContext({ userId: data.user.id });
				await ensureAppUserIfMissing(
					data.user.id,
					data.user.email ?? params.email,
				);
			} catch (prismaError: unknown) {
				const errorCode =
					typeof prismaError === "object" &&
					prismaError !== null &&
					"code" in prismaError &&
					typeof (prismaError as { code?: unknown }).code === "string"
						? (prismaError as { code: string }).code
						: undefined;
				if (errorCode === "P2002") {
					return { ok: true, needsConfirmation: true };
				}
				logger.error("auth.register.user_create_failed", prismaError, {
					subsystem: "auth",
					email: params.email,
					account_type: params.accountType ?? null,
					db_subsystem: "db",
				});
				return { ok: false, error: "Registration currently unavailable." };
			}

			return { ok: true, needsConfirmation: !data.session };
		},
		{ route: "server_action:auth.registerWithEmailPassword" },
	);
}

export async function requestPasswordReset(email: string) {
	const supabase = createAnonClient();
	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${siteUrl}/resetPassword`,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	return { ok: true };
}

export async function updateMyPassword(password: string) {
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password });

	if (error) {
		return { ok: false, error: error.message };
	}

	return { ok: true };
}

export async function setPasswordWithTokens(params: {
	accessToken: string;
	refreshToken: string;
	password: string;
}) {
	if (!params.accessToken || !params.refreshToken) {
		return { ok: false, error: "Missing session tokens." };
	}

	const supabase = createAnonClient();
	const { error: sessionError } = await supabase.auth.setSession({
		access_token: params.accessToken,
		refresh_token: params.refreshToken,
	});

	if (sessionError) {
		return { ok: false, error: sessionError.message };
	}

	const { error } = await supabase.auth.updateUser({
		password: params.password,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	return { ok: true };
}
