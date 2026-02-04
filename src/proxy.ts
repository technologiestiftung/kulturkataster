import { NextResponse, type NextRequest } from "next/server";
import { i18nConfig } from "@/i18n";

export default async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const cleanedPathname = pathname.replace(/\/\(\.\)([^/]+)/g, "/$1");
	if (
		cleanedPathname.startsWith("/_next") ||
		cleanedPathname.startsWith("/resources") ||
		cleanedPathname === "/favicon.ico" ||
		cleanedPathname === "/robots.txt" ||
		cleanedPathname === "/sitemap.xml"
	) {
		return NextResponse.next();
	}

	const localePattern = new RegExp(`^/(${i18nConfig.locales.join("|")})(/|$)`);
	const needsLocaleRewrite = !localePattern.test(cleanedPathname);

	const rewriteUrl = needsLocaleRewrite
		? (() => {
				const url = req.nextUrl.clone();
				url.pathname = `/${i18nConfig.defaultLocale}${cleanedPathname}`;
				return url;
			})()
		: null;

	const hasSession = req.cookies
		.getAll()
		.some((cookie) => cookie.name.includes("sb-") && cookie.value.length > 0);
	const accessToken = getAccessTokenFromCookies(req.cookies.getAll());
	const isSessionValid = accessToken
		? isJwtNotExpired(accessToken)
		: hasSession;

	const isAccountBasePath =
		cleanedPathname === "/account" ||
		cleanedPathname.match(/^\/[a-z]{2}\/account$/);
	if (isAccountBasePath) {
		const url = req.nextUrl.clone();
		url.pathname = "/account/activity";
		return NextResponse.redirect(url);
	}

	const isAccountRoute =
		cleanedPathname.startsWith("/account") ||
		cleanedPathname.match(/^\/[a-z]{2}\/account/);
	const isLoginRoute =
		cleanedPathname.endsWith("/login") ||
		cleanedPathname.match(/^\/[a-z]{2}\/login$/);

	if (isAccountRoute && !isSessionValid) {
		const url = req.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	if (isLoginRoute && isSessionValid) {
		const url = req.nextUrl.clone();
		url.pathname = "/account/activity";
		return NextResponse.redirect(url);
	}

	return needsLocaleRewrite ? NextResponse.rewrite(rewriteUrl!) : NextResponse.next();
}

const getAccessTokenFromCookies = (
	cookies: { name: string; value: string }[],
) => {
	const accessTokenCookie = cookies.find((cookie) =>
		cookie.name.includes("access-token"),
	);
	if (accessTokenCookie?.value) return accessTokenCookie.value;

	const authTokenCookie = cookies.find((cookie) =>
		cookie.name.includes("auth-token"),
	);
	if (authTokenCookie?.value) {
		const maybeJson = authTokenCookie.value;
		try {
			const parsed = JSON.parse(maybeJson);
			if (parsed?.access_token) return String(parsed.access_token);
		} catch {
			if (isJwtLike(maybeJson)) return maybeJson;
		}
	}

	const fallbackJwt = cookies.find(
		(cookie) => cookie.name.includes("sb-") && isJwtLike(cookie.value),
	);
	return fallbackJwt?.value ?? null;
};

const isJwtLike = (value: string) => value.split(".").length === 3;

const isJwtNotExpired = (token: string) => {
	try {
		const payload = token.split(".")[1];
		const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
		const decoded = JSON.parse(atob(normalized));
		if (typeof decoded?.exp !== "number") return true;
		return decoded.exp * 1000 > Date.now();
	} catch {
		return true;
	}
};

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|resources/).*)",
	],
};
