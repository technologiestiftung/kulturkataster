"use client";

import ListView from "@/components/ListView/ListView";
import Map from "@/components/Map/Map";
import { useAppStore } from "@/lib/store/appStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Home() {
	const { t } = useTranslation("common");
	const { viewMode } = useAppStore();
	const router = useRouter();
	const pathname = usePathname();
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

	useEffect(() => {
		const firstTimeUser = useAppStore.getState().firstTimeUser;
		if (firstTimeUser) {
			const isHome = pathname === "/";
			if (isHome) {
				router.push("/welcome");
			}
		}
	}, []);

	return (
		<div className="items-center flex-1 justify-items-center h-full relative w-full">
			<section
				className={`h-full w-full ${viewMode === "map" ? "block" : "hidden"}`}
				aria-label={t("map.title")}
			>
				<Map />
			</section>
			<section
				className={`h-full w-full ${viewMode === "list" ? "block" : "hidden"}`}
				aria-label={t("listView.title")}
			>
				<ListView />
			</section>
		</div>
	);
}
