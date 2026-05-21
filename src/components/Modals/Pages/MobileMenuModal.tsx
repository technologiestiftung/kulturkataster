"use client";

import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import Close from "@/icons/close.svg";
import KRBLogo from "@/logos/KRB.svg";
import InfoCircle from "@/icons/info-circle.svg";
import { SubMenuOption } from "@/components/Menu/SubMenuOption";
import MapIcon from "@/icons/map.svg";
import ListIcon from "@/icons/list.svg";
import { usePathname, useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import Download from "@/icons/download.svg";
import { ModalFooter } from "../ModalFooter";

export function MobileMenuModal() {
	const { t } = useTranslation("common");

	const router = useRouter();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();
	const isOpen = pathname?.includes("/mobileMenu");

	const closeModal = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push(toLocalePath("/map"));
		}
	};

	return (
		<Dialog
			open={!!isOpen}
			onOpenChange={(open) => {
				if (!open) {
					closeModal();
				}
			}}
		>
			<DialogContent
				variant="mobile-menu"
				className="h-full bg-sidebar flex flex-col"
				showCloseButton={false}
				showBackButton={false}
			>
				<DialogHeader className="flex-row shrinkitems-center justify-end p-4 space-y-0">
					<DialogTitle className="sr-only">{t("mobileMenu.title")}</DialogTitle>
					<button
						onClick={closeModal}
						className="flex items-center justify-center w-14 h-14 rounded-full bg-muted hover:bg-muted/80 transition-colors"
						aria-label={t("close")}
						data-testid="mobile-menu-close"
					>
						<Close className="w-6 h-6" />
					</button>
				</DialogHeader>
				<div className="tab-ring flex w-full flex-1 overflow-auto">
					<div className="flex flex-col overflow-auto  w-full justify-between">
						<div className="grow flex flex-col gap-4 p-4">
							<SubMenuOption
								key="map"
								icon={MapIcon}
								titleKey="map.title"
								onClick={() => {
									router.push(toLocalePath("/map"));
								}}
							/>
							<SubMenuOption
								key="listView"
								icon={ListIcon}
								titleKey="listView.title"
								onClick={() => {
									router.push(toLocalePath("/list"));
								}}
							/>
							<SubMenuOption
								key="download"
								icon={Download}
								titleKey="download.title"
								onClick={() => router.push(toLocalePath("/download"))}
							/>
							<SubMenuOption
								key="information"
								icon={InfoCircle}
								titleKey="information.title"
								onClick={() => router.push(toLocalePath("/info"))}
							/>
							<div className="space-y-4 flex flex-col">
								<span className="body2">{t("accessibility.title")}</span>
								<div className="">
									<AccessibilityContent />
								</div>
							</div>

							<ModalFooter />
						</div>
						<div className="flex shrink-0 gap-4 bg-neutral-10 p-4 justify-between items-center">
							<p className="body2">{t("footer.projectBy")}</p>
							<KRBLogo
								title="Kulturraum Berlin gGmbH, Logo"
								className="w-12 h-auto"
							/>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
