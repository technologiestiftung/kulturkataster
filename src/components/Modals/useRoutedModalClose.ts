"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

type UseRoutedModalCloseArgs = {
	returnTo?: string;
};

export function useRoutedModalClose({ returnTo }: UseRoutedModalCloseArgs) {
	const router = useRouter();
	const toLocalePath = useLocalePath();

	return useCallback(() => {
		if (returnTo) {
			router.replace(toLocalePath(returnTo));
			return;
		}

		if (typeof window === "undefined") {
			router.push(toLocalePath("/"));
			return;
		}
		router.back();
	}, [returnTo, router, toLocalePath]);
}
