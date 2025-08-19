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
	const { setFirstTimeUser } = useAppStore();

	const handleFooterClick = (itemId: string) => {
		onOpenChange(false); // Close modal first
		// Use setTimeout to ensure modal closes before opening new one
		setTimeout(() => {
			handleFooterItemClick(itemId);
		}, 100);
	};

	const handleWelcomeModalOpen = () => {
		onOpenChange(false); // Close mobile menu first
		setTimeout(() => {
			setFirstTimeUser(true); // This opens the welcome modal
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
					<DialogTitle className="sr-only">Mobile Menu</DialogTitle>
					<KukaSmallLogo className="size-14 cursor-pointer hover:opacity-80 transition-opacity" />
					<button
						onClick={() => onOpenChange(false)}
						className="flex items-center justify-center w-14 h-14 rounded-full bg-muted hover:bg-muted/80 transition-colors"
						aria-label={t("close")}
					>
						<Close className="w-6 h-6" />
					</button>
				</DialogHeader>
				<div className="flex flex-col justify-between flex-1">
					<div className="flex-1 flex flex-col gap-8 p-4 overflow-auto">
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
						<KRBLogo className="w-12 h-auto" />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
