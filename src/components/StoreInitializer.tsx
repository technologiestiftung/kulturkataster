"use client";

import { useEffect } from "react";
import { useInstitutionStore } from "@/lib/store/institutionStore";

export function StoreInitializer() {
	const initializeInstitutions = useInstitutionStore(
		(state) => state.initializeInstitutions,
	);
	const initializeCategories = useInstitutionStore(
		(state) => state.initializeCategories,
	);
	const initializeDistricts = useInstitutionStore(
		(state) => state.initializeDistricts,
	);

	useEffect(() => {
		initializeInstitutions();
	}, [initializeInstitutions]);

	useEffect(() => {
		initializeCategories();
	}, [initializeCategories]);

	useEffect(() => {
		initializeDistricts();
	}, [initializeDistricts]);

	return null;
}
