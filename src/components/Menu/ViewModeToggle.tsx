"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import BurgerMenu from "@/icons/burger-menu-icon.svg";

export function ViewModeToggle() {
	const { t } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();

	return (
		<div className="fixed block z-65 top-0 right-0 p-4 overflow-hidden">
			<div className="flex gap-2 items-center">
				<Button
					radius="full"
					variant="surface"
					iconSize="lg"
					title={t("common.mobileMenu.title")}
					onClick={() => router.push(toLocalePath("/mobileMenu"))}
					aria-label={t("common.mobileMenu.title")}
					className="md:hidden"
				>
					<BurgerMenu size={14} />
				</Button>
			</div>
		</div>
	);
}
