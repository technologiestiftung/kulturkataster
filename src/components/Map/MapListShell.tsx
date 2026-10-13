"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ListView from "@/components/ListView/ListView";
import MapInitializer from "@/components/Map/MapInitializer/MapInitializer";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function MapListShell() {
	const { t } = useTranslation();
	const pathname = usePathname();
	const toLocalePath = useLocalePath();
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
			className={`relative flex min-h-0 flex-1 h-full w-full ${routeMode === "map" ? "overflow-hidden" : ""}`}
		>
			<div
				className={
					routeMode === "map" ? "relative h-full min-h-0 w-full" : "hidden"
				}
				aria-hidden={routeMode !== "map"}
			>
				<section
					className="h-full min-h-0 w-full"
					aria-label={t("common.map.title")}
				>
					{/* Keyboard/screen-reader bypass for the map: the list view offers the same content. */}
					<Link
						href={toLocalePath("/list")}
						className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg tab-ring"
					>
						{t("common.a11y.map.skipToList")}
					</Link>
					<MapInitializer />
				</section>
			</div>
			{routeMode === "list" ? (
				<div className="relative flex-1 h-full min-h-0 w-full items-center justify-items-center">
					<section
						className="h-full min-h-0 w-full"
						aria-label={t("common.listView.title")}
					>
						<ListView />
					</section>
				</div>
			) : null}
		</div>
	);
}
