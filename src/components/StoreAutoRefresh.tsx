"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { getPublicInstitutionRefreshData } from "@/server/actions/publicInstitutionData";
import type { InstitutionStoreState } from "@/types";

const DEFAULT_PUBLIC_AUTO_REFRESH_INTERVAL_MS = 60_000;
const PUBLIC_AUTO_REFRESH_ENABLED_PATHS = new Set(["/map", "/list"]);

/**
 * Tracks the timestamp of the last successful refresh so that navigating to
 * /map or /list does not immediately fire a DB query if data was fetched
 * recently (within the polling interval).
 */
let lastPublicRefreshAt = 0;

const normalizePublicPathname = (pathname: string | null) => {
	if (!pathname) return null;

	const trimmedPathname =
		pathname.length > 1 && pathname.endsWith("/")
			? pathname.slice(0, -1)
			: pathname;
	const publicRouteIndex =
		trimmedPathname.indexOf("/map") >= 0
			? trimmedPathname.indexOf("/map")
			: trimmedPathname.indexOf("/list");
	const normalizedPathname =
		publicRouteIndex >= 0
			? trimmedPathname.slice(publicRouteIndex)
			: trimmedPathname;

	if (normalizedPathname === "/map" || normalizedPathname.startsWith("/map/")) {
		return "/map";
	}
	if (
		normalizedPathname === "/list" ||
		normalizedPathname.startsWith("/list/")
	) {
		return "/list";
	}

	return normalizedPathname;
};

export const isPublicAutoRefreshPathEnabled = (pathname: string | null) => {
	const normalizedPathname = normalizePublicPathname(pathname);
	return (
		normalizedPathname !== null &&
		PUBLIC_AUTO_REFRESH_ENABLED_PATHS.has(normalizedPathname)
	);
};

const applyRefreshedPublicInstitutionData = (
	refreshedData: Awaited<ReturnType<typeof getPublicInstitutionRefreshData>>,
	setters: {
		setInstitutions: InstitutionStoreState["setInstitutions"];
		setCategories: InstitutionStoreState["setCategories"];
		setDistricts: InstitutionStoreState["setDistricts"];
	},
) => {
	if (refreshedData.institutions !== undefined) {
		setters.setInstitutions(refreshedData.institutions);
	}
	if (refreshedData.categories !== undefined) {
		setters.setCategories(refreshedData.categories);
	}
	if (refreshedData.districts !== undefined) {
		setters.setDistricts(refreshedData.districts);
	}
};

export function StoreAutoRefresh({
	intervalMs = DEFAULT_PUBLIC_AUTO_REFRESH_INTERVAL_MS,
}: {
	intervalMs?: number;
}) {
	const pathname = usePathname();
	const setInstitutions = useInstitutionStore((state) => state.setInstitutions);
	const setCategories = useInstitutionStore((state) => state.setCategories);
	const setDistricts = useInstitutionStore((state) => state.setDistricts);
	const isRefreshingRef = useRef(false);
	const isPollingEnabledForPath = isPublicAutoRefreshPathEnabled(pathname);

	useEffect(() => {
		let cancelled = false;
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const refresh = async () => {
			if (cancelled || isRefreshingRef.current || !isPollingEnabledForPath) {
				return;
			}
			if (document.visibilityState !== "visible") return;

			isRefreshingRef.current = true;
			try {
				const refreshedData = await getPublicInstitutionRefreshData();
				if (cancelled) return;
				applyRefreshedPublicInstitutionData(refreshedData, {
					setInstitutions,
					setCategories,
					setDistricts,
				});
				lastPublicRefreshAt = Date.now();
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

		if (isPollingEnabledForPath && document.visibilityState === "visible") {
			// Only fire an immediate refresh if data is stale (older than the interval).
			// This avoids redundant DB queries when navigating to map/list pages.
			const isStale = Date.now() - lastPublicRefreshAt >= intervalMs;
			if (isStale) {
				void refresh();
			}
			startPolling();
		} else {
			stopPolling();
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			cancelled = true;
			stopPolling();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [
		intervalMs,
		isPollingEnabledForPath,
		setCategories,
		setDistricts,
		setInstitutions,
	]);

	return null;
}
