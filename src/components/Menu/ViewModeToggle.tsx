"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, ButtonWithTooltip } from "@/components/ui/button";
import MapIcon from "@/icons/map.svg";
import ListIcon from "@/icons/list.svg";
import BurgerMenu from "@/icons/burger-menu-icon.svg";

export function ViewModeToggle() {
	const { t } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();

	const normalizedPath = useMemo(
		() => pathname?.replace(/\/$/, "") ?? "",
		[pathname],
	);
	const isListRoute = normalizedPath.endsWith("/list");
	const isMapRoute = normalizedPath.endsWith("/map");

	if (!isListRoute && !isMapRoute) return null;

	const currentViewMode = isListRoute ? "list" : "map";

	const handleViewModeSwitch = (newViewMode: "map" | "list") => {
		router.push(newViewMode === "map" ? "/map" : "/list");
	};

	return (
		<div className="fixed block z-[50] top-0 right-0 p-4 overflow-hidden">
			<div className="flex gap-2 items-center">
				<div className="relative">
					<div
						className="flex items-center bg-neutral-80 border rounded-full shadow-sm relative"
						role="radiogroup"
						aria-label={t("map.radioGroupAriaLabel")}
					>
						<div
							className={`absolute top-0 bottom-0 w-12 h-12 bg-background rounded-full transition-transform duration-300 ease-in-out ${
								isMapRoute ? "translate-x-0" : "translate-x-12"
							}`}
						/>
						<ButtonWithTooltip
							variant="menu-icon"
							size="icon-only"
							tooltip={t("map.show")}
							className={`${
								isMapRoute
									? "text-foreground"
									: "text-background hover:text-background/80"
							}`}
							onClick={() =>
								handleViewModeSwitch(
									currentViewMode === "list" ? "map" : "list",
								)
							}
							aria-label={t("map.show")}
							role="radio"
							aria-checked={isMapRoute}
							tabIndex={isMapRoute ? 0 : -1}
						>
							<MapIcon className="size-6" />
						</ButtonWithTooltip>
						<ButtonWithTooltip
							variant="menu-icon"
							size="icon-only"
							tooltip={t("listView.show")}
							className={`${
								isListRoute
									? "text-foreground"
									: "text-background hover:text-background/80"
							}`}
							onClick={() =>
								handleViewModeSwitch(currentViewMode === "map" ? "list" : "map")
							}
							aria-label={t("listView.show")}
							role="radio"
							aria-checked={isListRoute}
							tabIndex={isListRoute ? 0 : -1}
						>
							<ListIcon className="size-6" />
						</ButtonWithTooltip>
					</div>
				</div>

				<Button
					variant="rounded"
					size="icon-only"
					title={t("mobileMenu.title")}
					onClick={() => router.push("/mobileMenu")}
					aria-label={t("mobileMenu.title")}
					className="md:hidden"
				>
					<BurgerMenu size={14} />
				</Button>
			</div>
		</div>
	);
}
