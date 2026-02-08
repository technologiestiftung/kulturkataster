"use client";

import { useEffect, useMemo, useState } from "react";
import { getGuestReadableFields } from "@/server/actions/permissions";

const guestReadableFieldCache = new Map<string, string[]>();
const guestReadableFieldRequests = new Map<string, Promise<string[]>>();

const fetchGuestReadableFields = async (table: string): Promise<string[]> => {
	const cached = guestReadableFieldCache.get(table);
	if (cached) return cached;

	const pending = guestReadableFieldRequests.get(table);
	if (pending) return pending;

	const request = getGuestReadableFields(table)
		.then((fields) => {
			const deduped = Array.from(new Set(fields));
			guestReadableFieldCache.set(table, deduped);
			return deduped;
		})
		.catch(() => [])
		.finally(() => {
			guestReadableFieldRequests.delete(table);
		});

	guestReadableFieldRequests.set(table, request);
	return request;
};

export const useGuestReadableFields = (table: string) => {
	const [fields, setFields] = useState<string[]>(
		() => guestReadableFieldCache.get(table) ?? [],
	);
	const [isLoading, setIsLoading] = useState(
		() => !guestReadableFieldCache.has(table),
	);

	useEffect(() => {
		let active = true;
		if (guestReadableFieldCache.has(table)) {
			setFields(guestReadableFieldCache.get(table) ?? []);
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		void fetchGuestReadableFields(table).then((nextFields) => {
			if (!active) return;
			setFields(nextFields);
			setIsLoading(false);
		});
		return () => {
			active = false;
		};
	}, [table]);

	const fieldSet = useMemo(() => new Set(fields), [fields]);
	return { fields, fieldSet, isLoading };
};

