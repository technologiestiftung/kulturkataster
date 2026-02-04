"use server";

import { createAnonClient, createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";

export async function getCurrentUser() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) return null;
	return user;
}

export async function getAuthUserWithProfile() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return { supabase, user: null, profile: null };
	}

	const profile = await prisma.user.findUnique({
		where: { id: user.id },
	});

	return { supabase, user, profile };
}

export async function getCurrentUserId() {
	const user = await getCurrentUser();
	return user?.id ?? null;
}

export async function requireAuth() {
	const { supabase, user, profile } = await getAuthUserWithProfile();
	if (!user) return null;

	if (!profile || profile.status !== "active") {
		await supabase.auth.signOut();
		return null;
	}

	return user;
}

export async function loginWithEmailPassword(email: string, password: string) {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	const userId = data.user?.id ?? null;
	if (!userId) {
		await supabase.auth.signOut();
		return { ok: false, error: "missing_user" };
	}

	const { profile } = await getAuthUserWithProfile();
	if (!profile || profile.id !== userId || profile.status !== "active") {
		await supabase.auth.signOut();
		return { ok: false, error: "inactive" };
	}

	return { ok: true };
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
	const supabase = await createClient();

	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	const { data, error } = await supabase.auth.signUp({
		email: params.email,
		password: params.password,
		options: {
			emailRedirectTo: `${siteUrl}/reset-password`,
		},
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	if (data.user) {
		try {
			let metaInfo: Record<string, string> = {};

			if (params.accountType === "organization") {
				metaInfo = {
					organizationName: params.organizationName ?? "",
					organizationPosition: params.organizationPosition ?? "",
					organizationPhone: params.organizationPhone ?? "",
				};
			} else if (params.accountType === "district") {
				metaInfo = {
					districtName: params.districtName ?? "",
					districtOffice: params.districtOffice ?? "",
					districtPosition: params.districtPosition ?? "",
					districtPhone: params.districtPhone ?? "",
				};
			} else if (params.accountType === "administration") {
				metaInfo = {
					administrationName: params.administrationName ?? "",
					administrationPosition: params.administrationPosition ?? "",
					administrationPhone: params.administrationPhone ?? "",
				};
			}

			await prisma.user.upsert({
				where: { id: data.user.id },
				update: {
					email: data.user.email ?? params.email,
					first_name: params.firstName ?? null,
					last_name: params.lastName ?? null,
					account_type: params.accountType ?? null,
					meta_info:
						Object.keys(metaInfo).length > 0
							? (metaInfo as Record<string, string>)
							: undefined,
				},
				create: {
					id: data.user.id,
					email: data.user.email ?? params.email,
					first_name: params.firstName ?? null,
					last_name: params.lastName ?? null,
					account_type: params.accountType ?? null,
					meta_info:
						Object.keys(metaInfo).length > 0
							? (metaInfo as Record<string, string>)
							: undefined,
					status: "approval_pending",
				},
			});
		} catch (prismaError) {
			return {
				ok: false,
				error:
					prismaError instanceof Error
						? prismaError.message
						: "User creation failed.",
			};
		}
	}

	return { ok: true, needsConfirmation: !data.session };
}

export async function requestPasswordReset(email: string) {
	const supabase = createAnonClient();
	const siteUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
	console.log("siteUrl", siteUrl);
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${siteUrl}/reset-password`,
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
