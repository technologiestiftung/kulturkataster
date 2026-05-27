/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
	buildForwardedRequestHeaders,
	REQUEST_ID_HEADER,
} from "@/server/logging/requestContext";

export async function updateSession(
	request: NextRequest,
	forwardedHeaders = buildForwardedRequestHeaders(request.headers, {
		method: request.method,
		pathname: request.nextUrl.pathname,
	}),
) {
	let supabaseResponse = NextResponse.next({
		request: {
			headers: forwardedHeaders,
		},
	});

	// With Fluid compute, don't put this client in a global environment
	// variable. Always create a new one on each request.
	const supabase = createServerClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet: any) {
					cookiesToSet.forEach(
						({ name, value }: { name: string; value: string }) =>
							request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({
						request: {
							headers: forwardedHeaders,
						},
					});
					cookiesToSet.forEach(
						({
							name,
							value,
							options,
						}: {
							name: string;
							value: string;
							options?: any;
						}) => supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// Do not run code between createServerClient and
	// supabase.auth.getClaims(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	// IMPORTANT: If you remove getClaims() and you use server-side rendering
	// with the Supabase client, your users may be randomly logged out.
	const { data } = await supabase.auth.getClaims();

	const pathname = request.nextUrl.pathname;
	const localeMatch = pathname.match(/^\/([a-zA-Z-]{2,5})(?=\/)/);
	const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
	const appPath = localePrefix ? pathname.replace(localePrefix, "") : pathname;
	const isLoginPath = appPath === "/login";
	const isResetPasswordPath = appPath.startsWith("/resetPassword");
	const isAccountPath = appPath.startsWith("/account");

	const user = data?.claims;
	if (!user && !isLoginPath && !isResetPasswordPath && isAccountPath) {
		const url = request.nextUrl.clone();
		url.pathname = `${localePrefix}/login`;
		const response = NextResponse.redirect(url);
		const requestId = forwardedHeaders.get(REQUEST_ID_HEADER);
		if (requestId) {
			response.headers.set(REQUEST_ID_HEADER, requestId);
		}
		return response;
	}

	if (user && (isLoginPath || isResetPasswordPath)) {
		const url = request.nextUrl.clone();
		url.pathname = `${localePrefix}/account/activity`;
		const response = NextResponse.redirect(url);
		const requestId = forwardedHeaders.get(REQUEST_ID_HEADER);
		if (requestId) {
			response.headers.set(REQUEST_ID_HEADER, requestId);
		}
		return response;
	}

	// IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
	// creating a new response object with NextResponse.next() make sure to:
	// 1. Pass the request in it, like so:
	//    const myNewResponse = NextResponse.next({ request })
	// 2. Copy over the cookies, like so:
	//    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
	// 3. Change the myNewResponse object to fit your needs, but avoid changing
	//    the cookies!
	// 4. Finally:
	//    return myNewResponse
	// If this is not done, you may be causing the browser and server to go out
	// of sync and terminate the user's session prematurely!

	const requestId = forwardedHeaders.get(REQUEST_ID_HEADER);
	if (requestId) {
		supabaseResponse.headers.set(REQUEST_ID_HEADER, requestId);
	}

	return supabaseResponse;
}
