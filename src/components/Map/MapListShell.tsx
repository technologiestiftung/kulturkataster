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
	const isAccountRoute = normalizedPath?.includes("/account") ?? false;

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

	if (isAccountRoute) {
		return null;
	}

	return (
		<div
			className={"relative flex min-h-0 flex-1 h-full w-full overflow-hidden"}
		>
			<div
				className={
					routeMode === "map" ? "relative h-full min-h-0 w-full" : "hidden"
				}
				aria-hidden={routeMode !== "map"}
			>
				<section className="h-full min-h-0 w-full" aria-label={t("map.title")}>
					<MapInitializer />
				</section>
			</div>
			{routeMode === "list" ? (
				<div className="relative flex-1 h-full min-h-0 w-full items-center justify-items-center">
					<section
						className="h-full min-h-0 w-full"
						aria-label={t("listView.title")}
					>
						<ListView />
					</section>
				</div>
			) : null}
		</div>
	);
}
