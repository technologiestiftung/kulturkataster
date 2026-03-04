"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { localePath } from "@/lib/utils/localePath";
import { allowedLocales } from "@/i18n/config";

export function useLocalePath() {
	const pathname = usePathname();
	const locale = useMemo(() => {
		if (!pathname) return undefined;
		const firstSegment = pathname.split("/").filter(Boolean)[0];
		if (!firstSegment) return undefined;
		return allowedLocales.includes(firstSegment) ? firstSegment : undefined;
	}, [pathname]);

	return useMemo(() => {
		return (path: string) => localePath(locale, path);
	}, [locale]);
}
