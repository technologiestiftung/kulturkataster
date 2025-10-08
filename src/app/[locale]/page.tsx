"use client";

import ListView from "@/components/ListView/ListView";
import Map from "@/components/Map/Map";
import { useAppStore } from "@/lib/store/appStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useEffect } from "react";

export default function Home() {
	const viewMode = useAppStore((state) => state.viewMode);
	const initializeInstitutions = useInstitutionStore(
		(state) => state.initializeInstitutions,
	);
	const initializeCategories = useInstitutionStore(
		(state) => state.initializeCategories,
	);

	useEffect(() => {
		initializeCategories();
	}, [initializeCategories]);

	useEffect(() => {
		initializeInstitutions();
	}, [initializeInstitutions]);

	return (
		<div className="items-center flex-1 justify-items-center h-full relative w-full">
			{viewMode === "map" ? <Map /> : <ListView />}
		</div>
	);
}
