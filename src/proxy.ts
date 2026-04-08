import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { allowedLocales, defaultLocale } from "@/i18n/config";
import {
	buildForwardedRequestHeaders,
	REQUEST_ID_HEADER,
} from "@/server/logging/requestContext";
import { updateSession } from "./lib/supabase-proxy";

function getPreferredLocale(request: NextRequest): string {
	const headers: Record<string, string> = {
		"accept-language": request.headers.get("accept-language") ?? "",
	};
	const languages = new Negotiator({ headers }).languages();
	const locales = Array.from(new Set(allowedLocales));
	return match(languages, locales, defaultLocale);
}

function pathnameHasLocale(pathname: string): boolean {
	return allowedLocales.some(
		(locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
	);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const forwardedHeaders = buildForwardedRequestHeaders(request.headers, {
		method: request.method,
		pathname,
	});
	const requestId = forwardedHeaders.get(REQUEST_ID_HEADER);

	// Keep API routes and public static resources untouched.
	if (
		!pathname.startsWith("/api") &&
		!pathname.startsWith("/resources") &&
		!pathnameHasLocale(pathname)
	) {
		const locale = getPreferredLocale(request);
		const url = request.nextUrl.clone();
		url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
		const response = NextResponse.redirect(url);
		if (requestId) {
			response.headers.set(REQUEST_ID_HEADER, requestId);
		}
		return response;
	}

	// update user's auth session
	return await updateSession(request, forwardedHeaders);
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/",
		"/(de|en)/:path*",
		"/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
