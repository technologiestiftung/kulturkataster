"use client";

import { useEffect } from "react";
import { useInstitutionStore } from "@/lib/store/institutionStore";

export function StoreInitializer() {
	const initializePublicData = useInstitutionStore(
		(state) => state.initializePublicData,
	);

	useEffect(() => {
		initializePublicData();
	}, [initializePublicData]);

	return null;
}
