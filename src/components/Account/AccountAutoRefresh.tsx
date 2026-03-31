"use client";

import { useEffect, useRef } from "react";
import { useAccountStore } from "@/lib/store/accountStore";
import { getUsers } from "@/server/actions/users";
import { getGroups } from "@/server/actions/groups";
import { getRoles } from "@/server/actions/roles";
import { getCategories } from "@/server/actions/categories";
import { getMyInstitutions } from "@/server/actions/institutions";
import { getSubmissions } from "@/server/actions/submissions";
import { getEntityAudits } from "@/server/actions/entityAudits";

const DEFAULT_ACCOUNT_AUTO_REFRESH_INTERVAL_MS = 10_000;

const applySettledValue = <T,>(
	result: PromiseSettledResult<T>,
	setter: (value: T) => void,
) => {
	if (result.status === "fulfilled") {
		setter(result.value);
	}
};

export function AccountAutoRefresh({
	intervalMs = DEFAULT_ACCOUNT_AUTO_REFRESH_INTERVAL_MS,
}: {
	intervalMs?: number;
}) {
	const setUsers = useAccountStore((state) => state.setUsers);
	const setGroups = useAccountStore((state) => state.setGroups);
	const setRoles = useAccountStore((state) => state.setRoles);
	const setCategories = useAccountStore((state) => state.setCategories);
	const setInstitutions = useAccountStore((state) => state.setInstitutions);
	const setSubmissions = useAccountStore((state) => state.setSubmissions);
	const setEntityAudits = useAccountStore((state) => state.setEntityAudits);
	const isRefreshingRef = useRef(false);

	useEffect(() => {
		let cancelled = false;
		let intervalId: ReturnType<typeof setInterval> | null = null;

		const refresh = async () => {
			if (cancelled || isRefreshingRef.current) return;
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
			if (intervalId) return;
			intervalId = setInterval(refresh, intervalMs);
		};

		const stopPolling = () => {
			if (!intervalId) return;
			clearInterval(intervalId);
			intervalId = null;
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refresh();
				startPolling();
				return;
			}
			stopPolling();
		};

		if (document.visibilityState === "visible") {
			startPolling();
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
	]);

	return null;
}
