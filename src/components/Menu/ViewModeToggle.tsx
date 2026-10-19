"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { rememberMobileMenuOrigin } from "@/lib/utils/mobileMenuOrigin";
import BurgerMenu from "@/icons/burger-menu-icon.svg";
import Clipboard from "@/icons/clipboard.svg";

export function ViewModeToggle({
	showQuestionnaire,
}: {
	showQuestionnaire: boolean;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();

	return (
		<div className="fixed block z-49 top-0 right-0 p-4 overflow-hidden">
			<div className="flex gap-2 items-center">
				{showQuestionnaire && (
					<Button
						variant="secondary"
						className="hidden bg-background md:flex border border-muted-foreground text-interaction-dark shadow [&_svg]:size-6 hover:bg-neutral-5"
						onClick={() => router.push(toLocalePath("/questionnaire"))}
					>
						<Clipboard />
						<p>{t("content.welcomeModal.questionnaire")}</p>
					</Button>
				)}
				<Button
					radius="full"
					variant="surface"
					iconSize="lg"
					title={t("common.mobileMenu.title")}
					onClick={() => {
						rememberMobileMenuOrigin(
							`${window.location.pathname}${window.location.search}`,
						);
						router.push(toLocalePath("/mobileMenu"));
					}}
					aria-label={t("common.mobileMenu.title")}
					className="md:hidden"
				>
					<BurgerMenu size={14} />
				</Button>
			</div>
		</div>
	);
}
