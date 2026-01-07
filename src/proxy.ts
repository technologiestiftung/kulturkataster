import { NextResponse, type NextRequest } from "next/server";
import {
	createServerClient,
	type CookieMethodsServer,
	type CookieOptions,
} from "@supabase/ssr";
import { i18nConfig } from "@/i18n";

export default async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/resources") ||
		pathname === "/favicon.ico" ||
		pathname === "/robots.txt" ||
		pathname === "/sitemap.xml"
	) {
		return NextResponse.next();
	}

	const localePattern = new RegExp(`^/(${i18nConfig.locales.join("|")})(/|$)`);
	const needsLocaleRewrite = !localePattern.test(pathname);

	const rewriteUrl = needsLocaleRewrite
		? (() => {
				const url = req.nextUrl.clone();
				url.pathname = `/${i18nConfig.defaultLocale}${pathname}`;
				return url;
			})()
		: null;

	const res = needsLocaleRewrite
		? NextResponse.rewrite(rewriteUrl!)
		: NextResponse.next();

	const cookieMethods = {
		getAll() {
			return req.cookies.getAll().map((cookie) => ({
				name: cookie.name,
				value: cookie.value,
			}));
		},
		setAll(
			cookiesToSet: {
				name: string;
				value: string;
				options: CookieOptions;
			}[],
		) {
			cookiesToSet.forEach(({ name, value, options }) => {
				res.cookies.set(name, value, options);
			});
		},
		removeAll() {
			req.cookies.getAll().forEach((cookie) => {
				res.cookies.set(cookie.name, "", { maxAge: 0 });
			});
		},
	} satisfies CookieMethodsServer & {
		removeAll: () => void;
	};

	const supabase = createServerClient(
		process.env.SUPABASE_URL ?? "",
		process.env.SUPABASE_ANON_KEY ?? "",
		{
			cookies: cookieMethods,
		},
	);

	await supabase.auth.getSession();

	return res;
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|resources/).*)",
	],
};
