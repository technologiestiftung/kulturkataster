"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import Accessibility from "@/icons/accessibility.svg";
import Edit from "@/icons/edit.svg";
import InfoCircle from "@/icons/info-circle.svg";
import ListIcon from "@/icons/list.svg";
import UserIcon from "@/icons/user.svg";
import MapIcon from "@/icons/map.svg";
import DEIcon from "@/icons/lang/de.svg";
import ENIcon from "@/icons/lang/en.svg";
import Download from "@/icons/download.svg";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAppStore } from "@/lib/store/appStore";
import { allowedLocales, defaultLocale } from "@/i18n/config";
import { localePath } from "@/lib/utils/localePath";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { LayerTreeContent } from "@/components/Map/LayerTree/LayerTree";
import { useAccountStore } from "@/lib/store/accountStore";

type MenuItem = {
	id: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	route: string;
	showInMobile: boolean;
	showInAccount: boolean;
	showInMap: boolean;
	matchPattern?: RegExp;
};

const menuItems: MenuItem[] = [
	{
		id: "map",
		icon: MapIcon,
		label: "map.title",
		route: "/map",
		showInMobile: true,
		showInAccount: true,
		showInMap: true,
	},
	{
		id: "list",
		icon: ListIcon,
		label: "listView.title",
		route: "/list",
		showInMobile: true,
		showInAccount: true,
		showInMap: true,
	},
	{
		id: "add",
		icon: Edit,
		label: "add.title",
		route: "/institution",
		showInMobile: true,
		showInAccount: true,
		showInMap: true,
	},
	{
		id: "user",
		icon: UserIcon,
		showInMobile: true,
		showInAccount: true,
		showInMap: true,
		label: "user.title",
		route: "/account",
		matchPattern: /^\/[^/]+\/account/,
	},
];

const footerItems: MenuItem[] = [
	{
		id: "info",
		icon: InfoCircle,
		label: "info.title",
		route: "/info",
		matchPattern: /^\/[^/]+\/info/,
		showInMobile: false,
		showInAccount: false,
		showInMap: false,
	},
	{
		id: "download",
		icon: Download,
		label: "download.title",
		route: "/download",
		matchPattern: /^\/[^/]+\/download/,
		showInMobile: false,
		showInAccount: false,
		showInMap: false,
	},
	{
		id: "accessibility",
		icon: Accessibility,
		label: "accessibility.title",
		route: "/accessibilitySettings",
		matchPattern: /^\/[^/]+\/accessibility/,
		showInMobile: false,
		showInAccount: false,
		showInMap: false,
	},
	{
		id: "language",
		icon: DEIcon,
		label: "language.title",
		route: "#",
		showInMobile: false,
		showInAccount: false,
		showInMap: false,
	},
];

const isMenuItemActive = (
	item: MenuItem,
	pathname: string,
	toLocalePath: (path: string) => string,
): boolean => {
	const normalizedPath = pathname.replace(/\/$/, "");

	if (item.matchPattern) {
		return item.matchPattern.test(normalizedPath);
	}

	const localizedRoute = toLocalePath(item.route).replace(/\/$/, "");
	return (
		normalizedPath === localizedRoute ||
		normalizedPath.startsWith(`${localizedRoute}/`)
	);
};

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

function MobileSheetHandle({
	onPointerDown,
}: {
	onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
}) {
	return (
		<div
			className="md:hidden flex justify-center pb-2 touch-none"
			onPointerDown={onPointerDown}
		>
			<div className="w-10 h-1 bg-muted-foreground/90 rounded-full"></div>
		</div>
	);
}

function MobileSheetHeader({
	title,
	onHandlePointerDown,
}: {
	title: string;
	onHandlePointerDown?: React.PointerEventHandler<HTMLDivElement>;
}) {
	return (
		<>
			<div className="gap-3.5 p-2 h-16 shrink-0 shadow-sm z-10">
				<MobileSheetHandle onPointerDown={onHandlePointerDown} />
			</div>
			<SheetHeader className="sr-only">
				<SheetTitle>{title}</SheetTitle>
			</SheetHeader>
		</>
	);
}

export function Menu({
	sidebar,
	...props
}: React.ComponentProps<typeof Sidebar> & { sidebar: React.ReactNode }) {
	const { setOpen, setOpenMobile, isMobile } = useSidebar();
	const { t } = useTranslation("common");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();
	const { setFirstTimeUser } = useAppStore();
	const { currentProfile } = useAccountStore();
	const isLoggedIn = Boolean(currentProfile);

	const normalizedPath = useMemo(
		() => (pathname ? pathname.replace(/\/$/, "") : ""),
		[pathname],
	);
	const currentLocale = useMemo(() => {
		const firstSegment = normalizedPath.split("/").filter(Boolean)[0];
		return allowedLocales.includes(firstSegment) ? firstSegment : defaultLocale;
	}, [normalizedPath]);

	const currentSidebarInstitutionId = useMemo(() => {
		const match = normalizedPath.match(/\/(?:map|list)\/institution\/(\d+)$/);
		return match?.[1] ?? null;
	}, [normalizedPath]);

	const isAccessibilitySidebarRoute = useMemo(
		() => /^\/[^/]+\/accessibilitySettings(?:\/|$)/.test(normalizedPath),
		[normalizedPath],
	);

	const isMapRoute = useMemo(
		() => /^\/[^/]+\/map(?:\/|$)/.test(normalizedPath),
		[normalizedPath],
	);

	const showSecondarySidebar =
		isAccessibilitySidebarRoute ||
		(Boolean(currentSidebarInstitutionId) && isMapRoute);
	const [isSecondarySidebarMounted, setIsSecondarySidebarMounted] =
		useState(showSecondarySidebar);
	const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
		useState(showSecondarySidebar);

	const isAccountRoute = useMemo(
		() => normalizedPath.includes("/account"),
		[normalizedPath],
	);

	useEffect(() => {
		if (isAccountRoute) {
			setOpen(false);
			setOpenMobile(false);
		}
	}, [isAccountRoute, setOpen, setOpenMobile]);

	useEffect(() => {
		if (!showSecondarySidebar) {
			setOpen(false);
			setOpenMobile(false);
			return;
		}
		if (!isAccountRoute) {
			setOpen(false);
		}
	}, [showSecondarySidebar, isAccountRoute, setOpen, setOpenMobile]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		if (showSecondarySidebar) {
			setIsSecondarySidebarMounted(true);
			requestAnimationFrame(() => {
				setIsSecondarySidebarVisible(true);
			});
		} else {
			setIsSecondarySidebarVisible(false);
			timeoutId = setTimeout(() => {
				setIsSecondarySidebarMounted(false);
			}, 220);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [showSecondarySidebar]);

	const isMobileInstitutionDetailRoute =
		isMobile && Boolean(currentSidebarInstitutionId) && isMapRoute;

	const isLayerTreeOpen = useAppStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useAppStore((state) => state.setIsLayerTreeOpen);

	const isMobileLayerTreeRoute = isMobile && isLayerTreeOpen && isMapRoute;
	const dragStartYRef = useRef<number | null>(null);
	const [mobileLayerTreeDragOffset, setMobileLayerTreeDragOffset] = useState(0);
	const [isDraggingMobileLayerTree, setIsDraggingMobileLayerTree] =
		useState(false);

	const handleLogoClick = () => {
		setFirstTimeUser(true);
		router.push(toLocalePath("/welcome"));
	};

	const handleMobileDetailsOpenChange = (nextOpen: boolean) => {
		if (nextOpen) return;
		if (!currentSidebarInstitutionId) return;
		router.replace(toLocalePath("/map"));
	};

	const handleMobileLayerTreeOpenChange = (nextOpen: boolean) => {
		setIsLayerTreeOpen(nextOpen);
	};

	const resetMobileLayerTreeDrag = () => {
		dragStartYRef.current = null;
		setIsDraggingMobileLayerTree(false);
		setMobileLayerTreeDragOffset(0);
	};

	const handleMobileLayerTreeDragStart = (clientY: number) => {
		if (!isMobileLayerTreeRoute) return;
		dragStartYRef.current = clientY;
		setIsDraggingMobileLayerTree(true);
	};

	const handleMobileLayerTreeDragMove = (clientY: number) => {
		const startY = dragStartYRef.current;
		if (!isMobileLayerTreeRoute || startY === null) return;
		setMobileLayerTreeDragOffset(Math.max(0, clientY - startY));
	};

	const handleMobileLayerTreeDragEnd = () => {
		if (!isMobileLayerTreeRoute) {
			resetMobileLayerTreeDrag();
			return;
		}

		const closeThreshold = 80;
		const shouldClose = mobileLayerTreeDragOffset > closeThreshold;
		resetMobileLayerTreeDrag();
		if (shouldClose) {
			handleMobileLayerTreeOpenChange(false);
		}
	};

	useEffect(() => {
		if (!isDraggingMobileLayerTree) return;

		const handlePointerMove = (event: PointerEvent) => {
			handleMobileLayerTreeDragMove(event.clientY);
		};

		const handlePointerEnd = () => {
			handleMobileLayerTreeDragEnd();
		};

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerEnd);
		window.addEventListener("pointercancel", handlePointerEnd);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerEnd);
			window.removeEventListener("pointercancel", handlePointerEnd);
		};
	}, [
		isDraggingMobileLayerTree,
		isMobileLayerTreeRoute,
		mobileLayerTreeDragOffset,
	]);

	useEffect(() => {
		if (!isMobileLayerTreeRoute) {
			resetMobileLayerTreeDrag();
		}
	}, [isMobileLayerTreeRoute]);

	const handleItemClick = (item: MenuItem) => {
		if (item.id === "language") {
			const targetLocale = currentLocale === "de" ? "en" : "de";
			const toggledPath = buildLocaleToggledPath(
				normalizedPath || `/${currentLocale}`,
				targetLocale,
			);
			const search =
				typeof window !== "undefined" ? window.location.search : "";
			router.push(`${toggledPath}${search}`);
			setOpen(false);
			setOpenMobile(false);
			return;
		}

		if (item.id === "user" && !isLoggedIn) {
			router.push(toLocalePath("/login"));
			setOpen(false);
			setOpenMobile(false);
			return;
		}

		if (item.route && item.route !== "#") {
			if (
				(item.id === "map" || item.id === "list") &&
				currentSidebarInstitutionId
			) {
				router.push(
					toLocalePath(
						`/${item.id}/institution/${currentSidebarInstitutionId}`,
					),
				);
			} else {
				router.push(toLocalePath(item.route));
			}
		}
		setOpen(false);
		setOpenMobile(false);
	};

	return (
		<>
			<nav aria-label={t("menu.navigation")} className="pointer-events-auto">
				<Sidebar
					collapsible="icon"
					className="relative overflow-visible *:data-[sidebar=sidebar]:flex-row [&_*]:!transition-none"
					{...props}
				>
					<Sidebar
						collapsible="none"
						className="w-[var(--sidebar-width-icon)] min-w-[var(--sidebar-width-icon)] max-w-[var(--sidebar-width-icon)] flex-shrink-0 border-r justify-center hidden md:flex md:fixed md:left-0 md:top-0 md:z-40 md:h-svh"
					>
						<SidebarHeader>
							<div className="my-2">
								<div className="flex justify-center">
									<button
										className=""
										onClick={handleLogoClick}
										aria-label={t("kukaLogoButton")}
									>
										<KukaSmallLogo
											title="Kulturkataster Berlin, Logo"
											className="size-14 cursor-pointer hover:opacity-80 transition-opacity"
										/>
									</button>
								</div>
							</div>
						</SidebarHeader>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										{menuItems
											.filter((item) =>
												isAccountRoute ? item.showInAccount : item.showInMap,
											)
											.map((item) => {
												const isActive = isMenuItemActive(
													item,
													normalizedPath,
													toLocalePath,
												);

												return (
													<SidebarMenuItem key={item.id}>
														<SidebarMenuButton
															tooltip={{
																children: t(item.label),
																hidden: false,
															}}
															onClick={() => handleItemClick(item)}
															isActive={isActive}
															aria-label={t(item.label)}
															aria-current={isActive ? "page" : undefined}
															className="relative"
														>
															{item.id === "user" && isLoggedIn && (
																<div className="absolute top-9.5 right-4 bg-brand-default rounded-full size-2.5 flex items-center justify-center" />
															)}
															<item.icon />
														</SidebarMenuButton>
													</SidebarMenuItem>
												);
											})}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
						<SidebarFooter>
							<SidebarMenu>
								{footerItems.map((item) => {
									const isActive = isMenuItemActive(
										item,
										normalizedPath,
										toLocalePath,
									);
									let Icon = item.icon;
									if (item.id === "language") {
										Icon = currentLocale !== "de" ? DEIcon : ENIcon;
									}
									return (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton
												tooltip={{
													children: t(item.label),
													hidden: false,
												}}
												onClick={() => handleItemClick(item)}
												isActive={isActive}
												aria-label={t(item.label)}
												aria-current={isActive ? "page" : undefined}
											>
												<Icon />
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarFooter>
					</Sidebar>

					{isSecondarySidebarMounted && (
						<div
							className={`hidden md:block pointer-events-none fixed left-[var(--sidebar-width-icon)] top-0 h-svh w-[calc(100vw-var(--sidebar-width-icon))] md:max-w-[var(--sidebar-width)] transition-all duration-200 ease-out ${
								isSecondarySidebarVisible
									? "translate-x-0 opacity-100"
									: "translate-x-2 opacity-0"
							}`}
						>
							<div className="pointer-events-auto bg-background h-full overflow-auto bg-neutral-10 md:bg-secondary shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-interaction-dark focus-visible:outline-offset-[-2px]">
								{sidebar}
							</div>
						</div>
					)}
				</Sidebar>
			</nav>

			<div className="fixed bottom-0 left-0 right-0 z-51 bg-sidebar border-t md:hidden h-20 pointer-events-auto">
				<SidebarMenu className="flex-row justify-around px-2 py-2">
					{menuItems
						.filter((item) => item.showInMobile)
						.map((item) => {
							const isActive = isMenuItemActive(
								item,
								normalizedPath,
								toLocalePath,
							);
							return (
								<SidebarMenuItem key={item.id} className="flex-shrink-0">
									<SidebarMenuButton
										onClick={() => handleItemClick(item)}
										isActive={isActive}
										className="flex-col h-auto py-2 px-3 w-auto size-14"
										aria-label={t(item.label)}
										aria-current={isActive ? "page" : undefined}
									>
										<item.icon className="size-6" />
										<span className="text-xs font-medium hidden">
											{t(item.label)}
										</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
				</SidebarMenu>
			</div>

			<Sheet
				open={isMobileInstitutionDetailRoute || isMobileLayerTreeRoute}
				onOpenChange={(open) => {
					if (isMobileInstitutionDetailRoute) {
						handleMobileDetailsOpenChange(open);
					} else if (isMobileLayerTreeRoute) {
						handleMobileLayerTreeOpenChange(open);
					}
				}}
			>
				<SheetContent
					side="bottom"
					className="h-[60vh] p-0 bottom-20"
					style={
						isMobileLayerTreeRoute && mobileLayerTreeDragOffset > 0
							? {
									transform: `translateY(${mobileLayerTreeDragOffset}px)`,
									transitionDuration: isDraggingMobileLayerTree
										? "0ms"
										: undefined,
								}
							: undefined
					}
					onClose={() => {
						if (isMobileInstitutionDetailRoute) {
							handleMobileDetailsOpenChange(false);
						} else if (isMobileLayerTreeRoute) {
							handleMobileLayerTreeOpenChange(false);
						}
					}}
				>
					<MobileSheetHeader
						title={
							isMobileInstitutionDetailRoute
								? t("institution.showDetails")
								: t("map.layerTreeTitle")
						}
						onHandlePointerDown={
							isMobileLayerTreeRoute
								? (event) => {
										handleMobileLayerTreeDragStart(event.clientY);
									}
								: undefined
						}
					/>
					<div
						className={
							isMobileInstitutionDetailRoute
								? "h-full overflow-auto"
								: "flex-1 overflow-auto p-2"
						}
					>
						{isMobileInstitutionDetailRoute ? sidebar : <LayerTreeContent />}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
