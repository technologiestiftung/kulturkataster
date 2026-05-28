"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { isPublicAutoRefreshPathEnabled } from "@/components/StoreAutoRefresh";
import type { Category, Institution } from "@/types";

type StoreInitializerProps = {
	publicData?: {
		institutions: Institution[];
		categories: Category[];
		districts: string[];
	};
};

export function StoreInitializer({ publicData }: StoreInitializerProps) {
	const pathname = usePathname();
	const hydratePublicData = useInstitutionStore(
		(state) => state.hydratePublicData,
	);
	const initializePublicData = useInstitutionStore(
		(state) => state.initializePublicData,
	);
	const isPublicRoute = isPublicAutoRefreshPathEnabled(pathname);

	useLayoutEffect(() => {
		if (!publicData) return;
		hydratePublicData(publicData);
	}, [hydratePublicData, publicData]);

	useEffect(() => {
		if (publicData || !isPublicRoute) return;
		initializePublicData();
	}, [initializePublicData, isPublicRoute, publicData]);

	return null;
}
