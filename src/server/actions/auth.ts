"use server";

import { createAnonClient, createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";

export async function getInsecureUser() {
	const session = await getSession();
	if (!session) return null;

	const user = await getCurrentUser();
	if (!user) return null;

	return user;
}

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

	const profile = await prisma.user.findUnique({
		where: { id: user.id },
	});

	return profile;
}

export async function getCurrentUserId() {
	const user = await getCurrentUser();
	return user?.id ?? null;
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

	const profile = await prisma.user.findUnique({
		where: { id: userId },
	});
	if (!profile) {
		await supabase.auth.signOut();
		return { ok: false, error: "missing_user" };
	}

	if (profile.status === "banned") {
		await supabase.auth.signOut();
		return { ok: false, error: "banned" };
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
			emailRedirectTo: `${siteUrl}/login`,
		},
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	if (data.user) {
		try {
			const existingUser = await prisma.user.findUnique({
				where: { id: data.user.id },
				select: { role_id: true },
			});
			const guestRole = await prisma.role.findUnique({
				where: { name: "guest" },
				select: { id: true },
			});
			const shouldAssignGuestRole =
				Boolean(guestRole?.id) &&
				(!existingUser || existingUser.role_id === null);

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
					role:
						shouldAssignGuestRole && guestRole
							? { connect: { id: guestRole.id } }
							: undefined,
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
					role: guestRole ? { connect: { id: guestRole.id } } : undefined,
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
