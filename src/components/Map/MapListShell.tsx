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
	const [lastRouteMode, setLastRouteMode] = useState<"map" | "list">(() =>
		normalizedPath?.endsWith("/list") ? "list" : "map",
	);

	const routeMode = useMemo(() => {
		if (normalizedPath?.endsWith("/list")) return "list";
		if (normalizedPath?.endsWith("/map")) return "map";
		return lastRouteMode;
	}, [lastRouteMode, normalizedPath]);

	useEffect(() => {
		if (normalizedPath?.endsWith("/list")) {
			setLastRouteMode("list");
		} else if (normalizedPath?.endsWith("/map")) {
			setLastRouteMode("map");
		}
	}, [normalizedPath]);

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
		</div>
	);
}
