"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { localePath } from "@/lib/utils/localePath";

export function useLocalePath() {
	const params = useParams<{ locale?: string | string[] }>();
	const localeParam = params?.locale;
	const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;

	return useMemo(() => {
		return (path: string) => localePath(locale, path);
	}, [locale]);
}
