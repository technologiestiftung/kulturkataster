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
import DEIcon from "@/icons/lang/de.svg";
import ENIcon from "@/icons/lang/en.svg";
import { usePathname, useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import Download from "@/icons/download.svg";
import { ModalFooter } from "../ModalFooter";
import { allowedLocales, defaultLocale } from "@/i18n/config";
import { localePath } from "@/lib/utils/localePath";
import { useMemo } from "react";

type MobileMenuItem = {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	route: string;
};

const mobileMenuItems: MobileMenuItem[] = [
	{
		id: "map",
		icon: MapIcon,
		label: "map.title",
		route: "/map",
	},
	{
		id: "list",
		icon: ListIcon,
		label: "listView.title",
		route: "/list",
	},
	{
		id: "download",
		icon: Download,
		label: "download.title",
		route: "/download",
	},
	{
		id: "info",
		icon: InfoCircle,
		label: "information.title",
		route: "/info",
	},
	{
		id: "language",
		icon: DEIcon,
		label: "language.title",
		route: "#",
	},
];

const buildLocaleToggledPath = (
	pathname: string,
	targetLocale: string,
): string => {
	const withoutLocale =
		pathname.replace(
			new RegExp(`^/(${allowedLocales.join("|")})(?=/|$)`),
			"",
		) || "/";
	return localePath(targetLocale, withoutLocale);
};

export function MobileMenuModal({
	hiddenMenuItems,
}: {
	hiddenMenuItems?: string[];
}) {
	const { t } = useTranslation();

	const router = useRouter();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();
	const isOpen = pathname?.includes("/mobileMenu");
	const normalizedPath = useMemo(
		() => (pathname ? pathname.replace(/\/$/, "") : ""),
		[pathname],
	);
	const currentLocale = useMemo(() => {
		const firstSegment = normalizedPath.split("/").filter(Boolean)[0];
		return allowedLocales.includes(firstSegment) ? firstSegment : defaultLocale;
	}, [normalizedPath]);
	const hiddenMenuItemIds = useMemo(
		() => new Set(hiddenMenuItems ?? []),
		[hiddenMenuItems],
	);

	const closeModal = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
		} else {
			router.push(toLocalePath("/map"));
		}
	};

	const handleItemClick = (item: MobileMenuItem) => {
		if (item.id === "language") {
			const targetLocale = currentLocale === "de" ? "en" : "de";
			const toggledPath = buildLocaleToggledPath(
				normalizedPath || `/${currentLocale}`,
				targetLocale,
			);
			const search =
				typeof window !== "undefined" ? window.location.search : "";
			router.push(`${toggledPath}${search}`);
			return;
		}

		router.push(toLocalePath(item.route));
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
				<DialogHeader className="flex-row shrink items-center justify-end p-4 space-y-0">
					<DialogTitle className="sr-only">
						{t("common.mobileMenu.title")}
					</DialogTitle>
					<button
						onClick={closeModal}
						className="flex items-center justify-center w-14 h-14 rounded-full bg-muted hover:bg-muted/80 transition-colors"
						aria-label={t("common.close")}
						data-testid="mobile-menu-close"
					>
						<Close className="w-6 h-6" />
					</button>
				</DialogHeader>
				<div className="tab-ring flex w-full flex-1 overflow-auto">
					<div className="flex flex-col overflow-auto  w-full justify-between">
						<div className="grow flex flex-col gap-4 p-4">
							{mobileMenuItems
								.filter((item) => !hiddenMenuItemIds.has(item.id))
								.map((item) => {
									let Icon = item.icon;
									if (item.id === "language") {
										Icon = currentLocale !== "de" ? DEIcon : ENIcon;
									}

									return (
										<SubMenuOption
											key={item.id}
											icon={Icon}
											titleKey={item.label}
											onClick={() => handleItemClick(item)}
										/>
									);
								})}

							{hiddenMenuItemIds.has("accessibility") ? null : (
								<div className="space-y-4 flex flex-col">
									<span className="body2">
										{t("common.accessibility.title")}
									</span>
									<div className="">
										<AccessibilityContent />
									</div>
								</div>
							)}

							<ModalFooter />
						</div>
						<div className="flex shrink-0 gap-4 bg-neutral-10 p-4 justify-between items-center">
							<p className="body2">{t("common.footer.projectBy")}</p>
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
