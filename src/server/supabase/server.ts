import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
	const cookieStore = await cookies();

	// @ts-expect-error - Supabase SSR cookie methods type mismatch
	return createServerClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(
					cookiesToSet: {
						name: string;
						value: string;
						options: CookieOptions;
					}[],
				): void {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
				removeAll() {
					cookieStore.getAll().forEach((cookie) => {
						cookieStore.set(cookie.name, "", { maxAge: 0 });
					});
				},
			},
		},
	);
}

export function createAdminClient() {
	const url = process.env.SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceRoleKey) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
	}

	return createSupabaseClient(url, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}

export function createAnonClient() {
	const url = process.env.SUPABASE_URL;
	const anonKey = process.env.SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
	}

	return createSupabaseClient(url, anonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}
