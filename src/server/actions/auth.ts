"use server";

import { createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";

export async function loginWithEmailPassword(email: string, password: string) {
	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return { ok: false, error: error.message };
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
}) {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signUp({
		email: params.email,
		password: params.password,
		options: {
			data: {
				first_name: params.firstName,
				last_name: params.lastName,
				account_type: params.accountType,
			},
		},
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	if (data.user) {
		try {
			await prisma.user.upsert({
				where: { id: data.user.id },
				update: {
					email: data.user.email ?? params.email,
					account_type: params.accountType ?? null,
				},
				create: {
					id: data.user.id,
					email: data.user.email ?? params.email,
					account_type: params.accountType ?? null,
					status: "pending",
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
