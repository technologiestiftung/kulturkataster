"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { isPublicAutoRefreshPathEnabled } from "@/components/StoreAutoRefresh";

export function StoreInitializer() {
	const pathname = usePathname();
	const initializePublicData = useInstitutionStore(
		(state) => state.initializePublicData,
	);
	const isPublicRoute = isPublicAutoRefreshPathEnabled(pathname);

	useEffect(() => {
		if (!isPublicRoute) return;
		initializePublicData();
	}, [initializePublicData, isPublicRoute]);

	return null;
}
