const isDev = process.env.NODE_ENV === "development";

let activeLabel: string | null = null;
let startTime: number | null = null;

export const devTimings = {
	start(label: string) {
		if (!isDev) return;
		activeLabel = label;
		startTime = performance.now();
	},
	end() {
		if (!isDev || startTime === null || activeLabel === null) return;
		const elapsed = performance.now() - startTime;
		console.log(`[timing] ${activeLabel}: ${elapsed.toFixed(1)}ms`);
		activeLabel = null;
		startTime = null;
	},
};

const MODAL_ACTION_SEGMENTS = new Set(["edit", "new", "review"]);

function labelFromUrl(url: string): string | null {
	const accountMatch = url.match(/\/account(\/[^?#]*)/);
	if (!accountMatch) return null;
	const segments = accountMatch[1].split("/").filter(Boolean);
	const action = segments[segments.length - 1];
	if (!MODAL_ACTION_SEGMENTS.has(action)) return null;
	const entity = segments[0] ?? "unknown";
	return `modal open → ${entity}/${action}`;
}

/**
 * Patches history.pushState to automatically start a timing whenever a
 * navigation targets a modal route (edit / new / review). Call once per
 * account layout mount; use the returned cleanup to restore the original.
 */
export function installModalNavigationTiming(): () => void {
	if (!isDev || typeof window === "undefined") return () => undefined;

	const orig = window.history.pushState.bind(window.history);
	window.history.pushState = (state, title, url) => {
		if (typeof url === "string") {
			const label = labelFromUrl(url);
			if (label) devTimings.start(label);
		}
		return orig(state, title, url);
	};

	return () => {
		window.history.pushState = orig;
	};
}
