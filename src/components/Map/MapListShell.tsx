"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ListView from "@/components/ListView/ListView";
import MapInitializer from "@/components/Map/MapInitializer/MapInitializer";

export function MapListShell() {
	const { t } = useTranslation("common");
	const pathname = usePathname();
	const normalizedPath = pathname?.replace(/\/$/, "");
	const isListRoute = /\/list(\/|$)/.test(normalizedPath ?? "");
	const isMapRoute = /\/map(\/|$)/.test(normalizedPath ?? "");
	const showMapListShell = isListRoute || isMapRoute;

	const [lastRouteMode, setLastRouteMode] = useState<"map" | "list">(() =>
		isListRoute ? "list" : "map",
	);

	const routeMode = useMemo(() => {
		if (isListRoute) return "list";
		if (isMapRoute) return "map";
		return lastRouteMode;
	}, [isListRoute, isMapRoute, lastRouteMode]);

	useEffect(() => {
		if (isListRoute) {
			setLastRouteMode("list");
		} else if (isMapRoute) {
			setLastRouteMode("map");
		}
	}, [isListRoute, isMapRoute]);

	if (normalizedPath?.includes("/account")) {
		return null;
	}

	return (
		<div
			className={
				showMapListShell ? "flex flex-1 h-full w-full relative" : "hidden"
			}
			aria-hidden={!showMapListShell}
		>
			<div
				className={routeMode === "map" ? "h-full w-full relative" : "hidden"}
				aria-hidden={routeMode !== "map"}
			>
				<section className="h-full w-full" aria-label={t("map.title")}>
					<MapInitializer />
				</section>
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
		</div>
	);
}
