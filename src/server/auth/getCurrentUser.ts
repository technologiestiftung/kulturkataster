"use server";

import { createClient } from "@/server/supabase/server";

export async function getCurrentUser() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) return null;
	return user;
}

export async function getCurrentUserId() {
	const user = await getCurrentUser();
	return user?.id ?? null;
}

export async function requireAuth() {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error(
			"Unauthenticated access to protected route - proxy should have redirected",
		);
	}
	return user;
}
