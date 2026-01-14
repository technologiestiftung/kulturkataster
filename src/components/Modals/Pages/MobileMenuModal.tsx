"use client";

import { AccessibilityContent } from "@/components/Menu/MenuContent/AccessibilityContent";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import Close from "@/icons/close.svg";
import KRBLogo from "@/logos/KRB.svg";
import InfoCircle from "@/icons/info-circle.svg";
import { SubMenuOption } from "@/components/Menu/SubMenuOption";
import MapIcon from "@/icons/map.svg";
import ListIcon from "@/icons/list.svg";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getModalLink } from "@/lib/utils/modalRouting";

const footerItems = [
	{ id: "about" },
	{ id: "imprint" },
	{ id: "privacy" },
	{ id: "accessibility" },
] as const;

export function MobileMenuModal() {
	const { t } = useTranslation("common");

	const router = useRouter();
	const pathname = usePathname();
	const isOpen = pathname?.includes("/mobileMenu");

	const closeModal = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push("/map");
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
				variant="mobileMenu"
				className="flex flex-col flex-1 bg-sidebar justify-between"
				showCloseButton={false}
				showBackButton={false}
			>
				<DialogHeader className="flex-row items-center justify-between p-4 space-y-0">
					<DialogTitle className="sr-only">{t("mobileMenu.title")}</DialogTitle>
					<button
						onClick={() => router.push("/welcome")}
						aria-label={t("kukaLogo")}
					>
						<KukaSmallLogo
							title="Kulturkataster Berlin, Logo"
							className="size-14 cursor-pointer hover:opacity-80 transition-opacity"
						/>
					</button>
					<button
						onClick={closeModal}
						className="flex items-center justify-center w-14 h-14 rounded-full bg-muted hover:bg-muted/80 transition-colors"
						aria-label={t("close")}
						data-testid="mobile-menu-close"
					>
						<Close className="w-6 h-6" />
					</button>
				</DialogHeader>
				<div className="overflow-scroll tab-ring">
					<div className="flex flex-col justify-between flex-1">
						<div className="flex-1 flex flex-col gap-4 p-4 overflow-auto mb-4">
							<SubMenuOption
								key="map"
								icon={MapIcon}
								titleKey="map.title"
								onClick={() => {
									router.push("/map");
								}}
							/>
							<SubMenuOption
								key="listView"
								icon={ListIcon}
								titleKey="listView.title"
								onClick={() => {
									router.push("/list");
								}}
							/>
							<SubMenuOption
								key="information"
								icon={InfoCircle}
								titleKey="information.title"
								onClick={() => router.push("/info")}
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
										<Link
											key={item.id}
											className="flex items-center justify-between text-left text-neutral-80"
											href={getModalLink(item.id).url}
											target={getModalLink(item.id).target}
											rel="noopener noreferrer"
										>
											<span className="body2">{t(`footer.${item.id}`)}</span>
										</Link>
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
