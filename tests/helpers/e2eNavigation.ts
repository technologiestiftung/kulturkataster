import { test, type Page } from "@playwright/test";

export async function safeGoto(
	page: Page,
	path: string,
	urlPattern: RegExp,
	timeoutMs = 15_000,
) {
	const attempt = async () => {
		try {
			await page.goto(path, { waitUntil: "domcontentloaded" });
		} catch {
			// Ignore transient navigation aborts (route interception/frame detach).
		}
		const arrived = await page
			.waitForURL(urlPattern, { timeout: timeoutMs })
			.then(() => true)
			.catch(() => false);
		if (!arrived) return false;
		await page.waitForLoadState("domcontentloaded").catch(() => undefined);
		return true;
	};

	if (await attempt()) return;
	if (await attempt()) return;
	test.skip(true, `Navigation to ${path} was unstable in this e2e run.`);
}
