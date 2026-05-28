import { type Page } from "@playwright/test";

const ACCOUNT_ROUTE_SEGMENT = "/account";
const ACCOUNT_SKELETON_SELECTOR = '[data-slot="skeleton"]';
const ACCOUNT_DASHBOARD_READY_PATHS = new Set([
	"/de/account",
	"/de/account/activity",
	"/de/account/institutions",
	"/de/account/users",
	"/de/account/groups",
	"/de/account/roles",
	"/de/account/categories",
]);
const ACCOUNT_TAB_LABELS: Record<string, RegExp> = {
	activity: /^Aktivität$/,
	institutions: /^Kulturorte$/,
	users: /^Nutzer\*innen$/,
	groups: /^Gruppen$/,
	roles: /^Rollen$/,
	categories: /^Kategorien$/,
};

function normalizePathname(pathname: string) {
	return pathname.length > 1 && pathname.endsWith("/")
		? pathname.slice(0, -1)
		: pathname;
}

async function waitForAccountRouteReady(page: Page, timeoutMs: number) {
	await page.waitForTimeout(100);
	await page.waitForFunction(
		(selector) => {
			const skeletons = Array.from(
				document.querySelectorAll<HTMLElement>(selector),
			);
			return !skeletons.some((skeleton) => {
				const style = window.getComputedStyle(skeleton);
				if (style.display === "none" || style.visibility === "hidden") {
					return false;
				}
				const rect = skeleton.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0;
			});
		},
		ACCOUNT_SKELETON_SELECTOR,
		{ timeout: timeoutMs },
	);
}

async function tryAccountTabFallback(
	page: Page,
	path: string,
	urlPattern: RegExp,
	timeoutMs: number,
) {
	const accountPathMatch = path.match(/\/account\/([^/?#]+)/);
	const accountTab = accountPathMatch?.[1];
	const tabLabel = accountTab ? ACCOUNT_TAB_LABELS[accountTab] : undefined;
	if (!tabLabel) return false;

	const tab = page.getByRole("tab", { name: tabLabel });
	if ((await tab.count()) === 0) return false;

	await tab.first().click();
	await page.waitForURL(urlPattern, { timeout: timeoutMs });
	return true;
}

export async function safeGoto(
	page: Page,
	path: string,
	urlPattern: RegExp,
	timeoutMs = 15_000,
) {
	const accountRootMatch = path.match(/^(\/[a-zA-Z-]{2,5})\/account\/?$/);
	const targetPath = accountRootMatch
		? `${accountRootMatch[1]}/account/activity`
		: path;
	const targetUrlPattern = accountRootMatch
		? new RegExp(`${accountRootMatch[1]}/account/activity/?$`)
		: urlPattern;

	try {
		await page.goto(targetPath, { waitUntil: "commit", timeout: timeoutMs });
	} catch {
		// Ignore transient navigation aborts (route interception/frame detach).
	}
	try {
		await page.waitForURL(targetUrlPattern, { timeout: timeoutMs });
	} catch (error) {
		const recovered = await tryAccountTabFallback(
			page,
			targetPath,
			targetUrlPattern,
			timeoutMs,
		).catch(() => false);
		if (recovered) {
			const currentPathname = normalizePathname(new URL(page.url()).pathname);
			if (
				path.includes(ACCOUNT_ROUTE_SEGMENT) &&
				ACCOUNT_DASHBOARD_READY_PATHS.has(currentPathname)
			) {
				await waitForAccountRouteReady(page, timeoutMs);
			}
			return;
		}

		const currentUrl = page.url();
		throw new Error(
			`safeGoto: navigating to "${targetPath}" did not reach the expected URL. Current URL: "${currentUrl}"`,
			{ cause: error },
		);
	}

	const currentPathname = normalizePathname(new URL(page.url()).pathname);
	if (
		path.includes(ACCOUNT_ROUTE_SEGMENT) &&
		ACCOUNT_DASHBOARD_READY_PATHS.has(currentPathname)
	) {
		await waitForAccountRouteReady(page, timeoutMs);
	}
}
