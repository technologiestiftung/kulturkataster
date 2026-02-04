import { NextResponse, type NextRequest } from "next/server";
import { i18nConfig } from "@/i18n";
import { updateSession } from "./lib/supabase-proxy";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const cleanedPathname = pathname.replace(/\/\(\.\)([^/]+)/g, "/$1");

	const localePattern = new RegExp(`^/(${i18nConfig.locales.join("|")})(/|$)`);
	const needsLocaleRewrite = !localePattern.test(cleanedPathname);
	const rewriteUrl = needsLocaleRewrite
		? (() => {
				const url = request.nextUrl.clone();
				url.pathname = `/${i18nConfig.defaultLocale}${cleanedPathname}`;
				return url;
			})()
		: null;

	const isAuthRoute =
		cleanedPathname.match(
			/^\/(account|login|register|forgot-password|reset-password)(\/|$)/,
		) ||
		cleanedPathname.match(
			/^\/[a-z]{2}\/(account|login|register|forgot-password|reset-password)(\/|$)/,
		);

	if (isAuthRoute) {
		const supabaseResponse = await updateSession(request);
		const location = supabaseResponse.headers.get("location");
		if (location) {
			return supabaseResponse;
		}
		if (needsLocaleRewrite) {
			const rewritten = NextResponse.rewrite(rewriteUrl!, { request });
			supabaseResponse.cookies.getAll().forEach((cookie) => {
				rewritten.cookies.set(cookie.name, cookie.value, cookie);
			});
			return rewritten;
		}
		return supabaseResponse;
	}

	if (needsLocaleRewrite) {
		return NextResponse.rewrite(rewriteUrl!);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|resources/).*)",
	],
};
