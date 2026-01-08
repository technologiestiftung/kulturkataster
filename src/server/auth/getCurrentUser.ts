"use server";

import { createClient } from "@/lib/supabase/server";

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
