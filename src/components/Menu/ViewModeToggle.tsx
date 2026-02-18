"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import BurgerMenu from "@/icons/burger-menu-icon.svg";

export function ViewModeToggle() {
	const { t } = useTranslation("common");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();

	const normalizedPath = useMemo(
		() => pathname?.replace(/\/$/, "") ?? "",
		[pathname],
	);
	const isListRoute = normalizedPath.endsWith("/list");
	const isMapRoute = normalizedPath.endsWith("/map");

	if (!isListRoute && !isMapRoute) return null;

	return (
		<div className="fixed block z-25 top-0 right-0 p-5 overflow-hidden">
			<div className="flex gap-2 items-center">
				<Button
					variant="rounded"
					size="icon-only"
					title={t("mobileMenu.title")}
					onClick={() => router.push(toLocalePath("/mobileMenu"))}
					aria-label={t("mobileMenu.title")}
					className="md:hidden"
				>
					<BurgerMenu size={14} />
				</Button>
			</div>
		</div>
	);
}
