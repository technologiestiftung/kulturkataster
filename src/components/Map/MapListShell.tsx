"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ListView from "@/components/ListView/ListView";
import MapInitializer from "@/components/Map/MapInitializer/MapInitializer";
import Filter from "@/components/Filter/Filter";
import { SearchContent } from "@/components/Menu/MenuContent/SearchContent";
import { useAppStore } from "@/lib/store/appStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";

export function MapListShell() {
	const { t } = useTranslation("common");
	const pathname = usePathname();
	const normalizedPath = pathname?.replace(/\/$/, "");
	const [lastRouteMode, setLastRouteMode] = useState<"map" | "list">(() =>
		/\/list(\/|$)/.test(normalizedPath ?? "") ? "list" : "map",
	);
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);

	const routeMode = useMemo(() => {
		if (/\/list(\/|$)/.test(normalizedPath ?? "")) return "list";
		if (/\/map(\/|$)/.test(normalizedPath ?? "")) return "map";
		return lastRouteMode;
	}, [lastRouteMode, normalizedPath]);
	const activePanel = useAppStore((state) => state.activePanel);
	const setActivePanel = useAppStore((state) => state.setActivePanel);

	useEffect(() => {
		if (/\/list(\/|$)/.test(normalizedPath ?? "")) {
			setLastRouteMode("list");
		} else if (/\/map(\/|$)/.test(normalizedPath ?? "")) {
			setLastRouteMode("map");
		}
	}, [normalizedPath]);

	useEffect(() => {
		const isMapRoute = /\/map(\/|$)/.test(normalizedPath ?? "");
		const isInstitutionRoute = /\/institution\/\d+$/.test(normalizedPath ?? "");
		if (!isMapRoute || isInstitutionRoute) {
			if (activePanel) {
				setActivePanel(null);
			}
		}
	}, [activePanel, normalizedPath, setActivePanel]);

	const institutionIdFromPath = useMemo(() => {
		if (!normalizedPath) return null;
		const match = normalizedPath.match(/\/institution\/(\d+)$/);
		if (!match) return null;
		const parsedId = Number(match[1]);
		return Number.isNaN(parsedId) ? null : parsedId;
	}, [normalizedPath]);

	useEffect(() => {
		if (institutionIdFromPath) {
			if (selectedInstitutionId !== institutionIdFromPath) {
				setSelectedInstitutionId(institutionIdFromPath);
			}
			return;
		}

		if (selectedInstitutionId) {
			setSelectedInstitutionId(null);
		}
	}, [institutionIdFromPath, selectedInstitutionId, setSelectedInstitutionId]);

	if (normalizedPath?.includes("/account")) {
		return null;
	}

	return (
		<div className="flex flex-1 h-full w-full relative	">
			<div
				className={routeMode === "map" ? "h-full w-full" : "hidden"}
				aria-hidden={routeMode !== "map"}
			>
				<MapInitializer />
			</div>
			<div
				className={
					routeMode === "list"
						? "items-center flex-1 h-full justify-items-center h-full relative w-full"
						: "hidden"
				}
				aria-hidden={routeMode !== "list"}
			>
				<section className="h-full w-full" aria-label={t("listView.title")}>
					<ListView />
				</section>
			</div>
			{routeMode === "map" && activePanel && (
				<div className="absolute inset-0 md:inset-y-0 md:left-0 md:w-[var(--sidebar-width)] z-40">
					<div className="h-full w-full bg-neutral-10 md:bg-secondary shadow-lg overflow-auto">
						{activePanel === "filter" && <Filter />}
						{activePanel === "search" && <SearchContent />}
					</div>
				</div>
			)}
		</div>
	);
}
