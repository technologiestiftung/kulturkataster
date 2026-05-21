"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function AccessibilitySettingsRedirect() {
	const router = useRouter();
	const isMobile = useIsMobile();
	const toLocalePath = useLocalePath();

	useEffect(() => {
		if (!isMobile) {
			return;
		}

		router.replace(toLocalePath("/mobileMenu"));
	}, [isMobile, router, toLocalePath]);

	return null;
}
