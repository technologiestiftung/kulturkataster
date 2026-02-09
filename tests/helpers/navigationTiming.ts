import type { Page, TestInfo } from "@playwright/test";

type NavigationTimingSnapshot = {
	url: string;
	type: string;
	startTime: number;
	duration: number;
	redirectCount: number;
	redirectTime: number;
	domainLookupTime: number;
	connectTime: number;
	requestTime: number;
	responseTime: number;
	domContentLoadedTime: number;
	loadEventTime: number;
	transferSize: number;
	encodedBodySize: number;
	decodedBodySize: number;
};

async function getLatestNavigationTiming(
	page: Page,
): Promise<NavigationTimingSnapshot | null> {
	return page.evaluate(() => {
		const entries = performance.getEntriesByType("navigation");
		if (!entries.length) return null;
		const nav = entries[entries.length - 1] as PerformanceNavigationTiming;
		return {
			url: nav.name,
			type: nav.type,
			startTime: nav.startTime,
			duration: nav.duration,
			redirectCount: nav.redirectCount,
			redirectTime: nav.redirectEnd - nav.redirectStart,
			domainLookupTime: nav.domainLookupEnd - nav.domainLookupStart,
			connectTime: nav.connectEnd - nav.connectStart,
			requestTime: nav.responseStart - nav.requestStart,
			responseTime: nav.responseEnd - nav.responseStart,
			domContentLoadedTime:
				nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
			loadEventTime: nav.loadEventEnd - nav.loadEventStart,
			transferSize: nav.transferSize,
			encodedBodySize: nav.encodedBodySize,
			decodedBodySize: nav.decodedBodySize,
		};
	});
}

function formatMs(value: number): string {
	return `${value.toFixed(1)}ms`;
}

function sanitizeLabel(label: string): string {
	return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export async function recordNavigationTiming(
	page: Page,
	testInfo: TestInfo,
	label: string,
) {
	const timing = await getLatestNavigationTiming(page);
	if (!timing) return;

	const payload = {
		label,
		capturedAt: new Date().toISOString(),
		...timing,
	};

	await testInfo.attach(`nav-timing-${sanitizeLabel(label)}`, {
		body: JSON.stringify(payload, null, 2),
		contentType: "application/json",
	});

	console.log(
		`[nav] ${label}: duration=${formatMs(timing.duration)} redirect=${timing.redirectCount} request=${formatMs(timing.requestTime)} response=${formatMs(timing.responseTime)} url=${timing.url}`,
	);
}
