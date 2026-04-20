"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAccountStore } from "@/lib/store/accountStore";
import { getUsers } from "@/server/actions/users";
import { getGroups } from "@/server/actions/groups";
import { getRoles } from "@/server/actions/roles";
import { getCategories } from "@/server/actions/categories";
import { getMyInstitutions } from "@/server/actions/institutions";
import { getSubmissions } from "@/server/actions/submissions";
import { getEntityAudits } from "@/server/actions/entityAudits";

const DEFAULT_ACCOUNT_AUTO_REFRESH_INTERVAL_MS = 10_000;
const ACCOUNT_AUTO_REFRESH_ENABLED_PATHS = new Set([
	"/account",
	"/account/activity",
	"/account/users",
	"/account/groups",
	"/account/roles",
	"/account/categories",
]);

const applySettledValue = <T,>(
	result: PromiseSettledResult<T>,
	setter: (value: T) => void,
) => {
	if (result.status === "fulfilled") {
		setter(result.value);
	}
};

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
	const setUsers = useAccountStore((state) => state.setUsers);
	const setGroups = useAccountStore((state) => state.setGroups);
	const setRoles = useAccountStore((state) => state.setRoles);
	const setCategories = useAccountStore((state) => state.setCategories);
	const setInstitutions = useAccountStore((state) => state.setInstitutions);
	const setSubmissions = useAccountStore((state) => state.setSubmissions);
	const setEntityAudits = useAccountStore((state) => state.setEntityAudits);
	const isRefreshingRef = useRef(false);
	const isPollingEnabledForPath = isAccountAutoRefreshPathEnabled(pathname);

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
				const [
					usersResult,
					groupsResult,
					rolesResult,
					categoriesResult,
					institutionsResult,
					submissionsResult,
					entityAuditsResult,
				] = await Promise.allSettled([
					getUsers(),
					getGroups(),
					getRoles(),
					getCategories(),
					getMyInstitutions(),
					getSubmissions(),
					getEntityAudits(),
				]);

				if (cancelled) return;

				applySettledValue(usersResult, setUsers);
				applySettledValue(groupsResult, setGroups);
				applySettledValue(rolesResult, setRoles);
				applySettledValue(categoriesResult, setCategories);
				applySettledValue(institutionsResult, setInstitutions);
				applySettledValue(submissionsResult, setSubmissions);
				applySettledValue(entityAuditsResult, setEntityAudits);
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
		setCategories,
		setEntityAudits,
		setGroups,
		setInstitutions,
		setRoles,
		setSubmissions,
		setUsers,
		intervalMs,
		isPollingEnabledForPath,
	]);

	return null;
}
