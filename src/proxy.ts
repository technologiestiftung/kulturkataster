import { NextResponse, type NextRequest } from "next/server";
import {
	createServerClient,
	type CookieMethodsServer,
	type CookieOptions,
} from "@supabase/ssr";
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

	const cookiesToSet: {
		name: string;
		value: string;
		options: CookieOptions;
	}[] = [];

	const applyCookies = (response: NextResponse) => {
		cookiesToSet.forEach(({ name, value, options }) => {
			response.cookies.set(name, value, options);
		});
	};

	const cookieMethods = {
		getAll() {
			return req.cookies.getAll().map((cookie) => ({
				name: cookie.name,
				value: cookie.value,
			}));
		},
		setAll(
			nextCookies: {
				name: string;
				value: string;
				options: CookieOptions;
			}[],
		) {
			nextCookies.forEach(({ name, value, options }) => {
				cookiesToSet.push({ name, value, options });
			});
		},
		removeAll() {
			req.cookies.getAll().forEach((cookie) => {
				cookiesToSet.push({
					name: cookie.name,
					value: "",
					options: { maxAge: 0 },
				});
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

	const res = needsLocaleRewrite
		? NextResponse.rewrite(rewriteUrl!)
		: NextResponse.next();
	applyCookies(res);
	return res;
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|resources/).*)",
	],
};
