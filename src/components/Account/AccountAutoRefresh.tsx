"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAccountStore } from "@/lib/store/accountStore";
import { getAccountRefreshData } from "@/server/actions/account";
import type { AccountDataPayload } from "@/server/utils/accountData";

type RefreshKeys = Array<keyof AccountDataPayload>;

let triggerFn: ((keys?: RefreshKeys) => void) | null = null;

/**
 * Per-key timestamps of the last successful refresh. Used to skip fetching
 * keys that were refreshed recently (e.g. by a modal action) when the component
 * mounts or the user navigates between account tabs.
 */
const lastRefreshedAt: Partial<Record<keyof AccountDataPayload, number>> = {};

const ALL_KEYS: ReadonlyArray<keyof AccountDataPayload> = [
	"users",
	"groups",
	"roles",
	"categories",
	"institutions",
	"submissions",
	"entityAudits",
];

const markRefreshed = (keys: RefreshKeys) => {
	const now = Date.now();
	for (const key of keys) {
		lastRefreshedAt[key] = now;
	}
};

const getStaleKeys = (
	keys: RefreshKeys,
	intervalMs: number,
): RefreshKeys | null => {
	const now = Date.now();
	const stale = keys.filter(
		(key) => now - (lastRefreshedAt[key] ?? 0) >= intervalMs,
	);
	return stale.length > 0 ? stale : null;
};

export function triggerAccountRefresh(keys?: RefreshKeys) {
	triggerFn?.(keys);
}

const DEFAULT_ACCOUNT_AUTO_REFRESH_INTERVAL_MS = 30_000;
const ACCOUNT_AUTO_REFRESH_ENABLED_PATHS = new Set([
	"/account",
	"/account/activity",
	"/account/users",
	"/account/groups",
	"/account/roles",
	"/account/categories",
]);

const normalizeAccountPathname = (pathname: string | null) => {
	if (!pathname) return null;

	const normalizedPathname =
		pathname.length > 1 && pathname.endsWith("/")
			? pathname.slice(0, -1)
			: pathname;
	const accountSegmentIndex = normalizedPathname.indexOf("/account");

	if (accountSegmentIndex === -1) {
		return normalizedPathname;
	}

	return normalizedPathname.slice(accountSegmentIndex);
};

export const isAccountAutoRefreshPathEnabled = (pathname: string | null) => {
	const normalizedPathname = normalizeAccountPathname(pathname);
	return (
		normalizedPathname !== null &&
		ACCOUNT_AUTO_REFRESH_ENABLED_PATHS.has(normalizedPathname)
	);
};


export function AccountAutoRefresh({
	intervalMs = DEFAULT_ACCOUNT_AUTO_REFRESH_INTERVAL_MS,
}: {
	intervalMs?: number;
}) {
	const pathname = usePathname();
	const setAccountData = useAccountStore((state) => state.setAccountData);
	const isRefreshingRef = useRef(false);
	const isPollingEnabledForPath = isAccountAutoRefreshPathEnabled(pathname);

	useEffect(() => {
		let cancelled = false;
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const refresh = async (keys?: RefreshKeys) => {
			if (cancelled || isRefreshingRef.current) return;
			if (!keys && !isPollingEnabledForPath) return;
			if (document.visibilityState !== "visible") return;

			isRefreshingRef.current = true;
			try {
				const refreshedData = await getAccountRefreshData(keys);
				if (cancelled) return;
				if (refreshedData) setAccountData(refreshedData);
				markRefreshed(keys ?? [...ALL_KEYS]);
			} finally {
				isRefreshingRef.current = false;
			}
		};

		const startPolling = () => {
			if (intervalId || !isPollingEnabledForPath) return;
			intervalId = setInterval(refresh, intervalMs);
		};

		const stopPolling = () => {
			if (!intervalId) return;
			clearInterval(intervalId);
			intervalId = null;
		};

		const handleVisibilityChange = () => {
			if (!isPollingEnabledForPath) {
				stopPolling();
				return;
			}
			if (document.visibilityState === "visible") {
				void refresh();
				startPolling();
				return;
			}
			stopPolling();
		};

		triggerFn = (keys) => void refresh(keys);

		if (isPollingEnabledForPath && document.visibilityState === "visible") {
			// Only fetch keys that haven't been refreshed recently (within the interval).
			// This avoids redundant DB queries when navigating between account tabs or
			// right after a modal action already refreshed specific slices.
			const staleKeys = getStaleKeys([...ALL_KEYS], intervalMs);
			if (staleKeys !== null) {
				// If all keys are stale, pass undefined to fetch everything at once.
				// If only some are stale, pass just those keys for a targeted fetch.
				const keysToFetch =
					staleKeys.length === ALL_KEYS.length ? undefined : staleKeys;
				void refresh(keysToFetch);
			}
			startPolling();
		} else {
			stopPolling();
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			cancelled = true;
			triggerFn = null;
			stopPolling();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [setAccountData, intervalMs, isPollingEnabledForPath]);

	return null;
}
