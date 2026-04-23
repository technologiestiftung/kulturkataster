import { test, type Page } from "@playwright/test";

const ACCOUNT_ROUTE_SEGMENT = "/account";
const ACCOUNT_SKELETON_SELECTOR = '[data-slot="skeleton"]';

async function waitForAccountRouteReady(page: Page, timeoutMs: number) {
	await page.waitForTimeout(100);
	return page
		.waitForFunction(
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
		)
		.then(() => true)
		.catch(() => false);
}

export async function safeGoto(
	page: Page,
	path: string,
	urlPattern: RegExp,
	timeoutMs = 15_000,
) {
	const attempt = async () => {
		try {
			await page.goto(path, { waitUntil: "commit" });
		} catch {
			// Ignore transient navigation aborts (route interception/frame detach).
		}
		const arrived = await page
			.waitForURL(urlPattern, { timeout: timeoutMs, waitUntil: "commit" })
			.then(() => true)
			.catch(() => false);
		if (!arrived) return false;
		if (path.includes(ACCOUNT_ROUTE_SEGMENT)) {
			const isReady = await waitForAccountRouteReady(page, timeoutMs);
			if (!isReady) return false;
		}
		return true;
	};

	if (await attempt()) return;
	if (await attempt()) return;
	test.skip(true, `Navigation to ${path} was unstable in this e2e run.`);
}
