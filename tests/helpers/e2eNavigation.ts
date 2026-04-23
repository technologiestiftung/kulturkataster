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

export async function safeGoto(
	page: Page,
	path: string,
	urlPattern: RegExp,
	timeoutMs = 15_000,
) {
	try {
		await page.goto(path, { waitUntil: "commit", timeout: timeoutMs });
	} catch {
		// Ignore transient navigation aborts (route interception/frame detach).
	}
	const urlAfterCommit = page.url();
	if (!urlAfterCommit.includes(path.split("?")[0])) {
		throw new Error(
			`safeGoto: navigating to "${path}" was redirected to "${urlAfterCommit}" — check auth storage state`,
		);
	}
	await page.waitForURL(urlPattern, { timeout: timeoutMs });
	const currentPathname = normalizePathname(new URL(page.url()).pathname);
	if (
		path.includes(ACCOUNT_ROUTE_SEGMENT) &&
		ACCOUNT_DASHBOARD_READY_PATHS.has(currentPathname)
	) {
		await waitForAccountRouteReady(page, timeoutMs);
	}
}
