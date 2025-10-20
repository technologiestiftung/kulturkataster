"use client";

import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useModalStore } from "@/lib/store/modalStore";
import { useAppStore } from "@/lib/store/appStore";
import { useTranslation } from "react-i18next";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import Close from "@/icons/close.svg";
import KRBLogo from "@/logos/KRB.svg";
import InfoCircle from "@/icons/info-circle.svg";
import { SubMenuOption } from "@/components/Menu/SubMenuOption";
import MapIcon from "@/icons/map-02.svg";
import ListIcon from "@/icons/list.svg";

interface MobileMenuModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "accessibility" },
] as const;

export function MobileMenuModal({ open, onOpenChange }: MobileMenuModalProps) {
	const { t } = useTranslation("common");
	const { handleFooterItemClick } = useModalStore();
	const { setFirstTimeUser, setViewMode } = useAppStore();

	const handleFooterClick = (itemId: string) => {
		onOpenChange(false);
		setTimeout(() => {
			handleFooterItemClick(itemId);
		}, 100);
	};

	const handleLogoClick = () => {
		setFirstTimeUser(true);
	};

	const handleWelcomeModalOpen = () => {
		onOpenChange(false);
		setTimeout(() => {
			setFirstTimeUser(true);
		}, 100);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant="mobileMenu"
				className="flex flex-col flex-1 bg-sidebar justify-between"
				showCloseButton={false}
			>
				<DialogHeader className="flex-row items-center justify-between p-4 space-y-0">
					<DialogTitle className="sr-only">{t("mobileMenu.title")}</DialogTitle>
					<button onClick={handleLogoClick} aria-label={t("kukaLogo")}>
						<KukaSmallLogo
							title="Kulturkataster Berlin, Logo"
							className="size-14 cursor-pointer hover:opacity-80 transition-opacity"
						/>
					</button>
					<button
						onClick={() => onOpenChange(false)}
						className="flex items-center justify-center w-14 h-14 rounded-full bg-muted hover:bg-muted/80 transition-colors"
						aria-label={t("close")}
					>
						<Close className="w-6 h-6" />
					</button>
				</DialogHeader>
				<div className="overflow-scroll">
					<div className="flex flex-col justify-between flex-1">
						<div className="flex-1 flex flex-col gap-4 p-4 overflow-auto mb-4">
							<SubMenuOption
								key="map"
								icon={MapIcon}
								titleKey="map.title"
								onClick={() => {
									onOpenChange(false);
									setViewMode("map");
								}}
							/>
							<SubMenuOption
								key="listView"
								icon={ListIcon}
								titleKey="listView.title"
								onClick={() => {
									onOpenChange(false);
									setViewMode("list");
								}}
							/>
							<SubMenuOption
								key="information"
								icon={InfoCircle}
								titleKey="information.title"
								onClick={handleWelcomeModalOpen}
							/>
							<div className="space-y-4 flex flex-col">
								<span className="body2">{t("accessibility.title")}</span>
								<div className="">
									<AccessibilityContent />
								</div>
							</div>

							<div className="space-y-4 mt-auto">
								<div className="flex flex-col gap-4">
									{footerItems.map((item) => (
										<button
											key={item.id}
											onClick={() => handleFooterClick(item.id)}
											className="flex items-center justify-between text-left text-neutral-80"
										>
											<span className="body2">{t(`footer.${item.id}`)}</span>
										</button>
									))}
								</div>
							</div>
						</div>
						<div className="flex gap-4 flex-0 bg-neutral-10 p-4 justify-between items-center">
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
