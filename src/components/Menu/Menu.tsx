/* eslint-disable */
"use client";

import { Button } from "@/components/ui/button";
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
import Accessibility from "@/icons/accessibility.svg";
import Download from "@/icons/download.svg";
import Edit from "@/icons/edit.svg";
import FilterLines from "@/icons/filter-lines.svg";
import InfoCircle from "@/icons/info-circle.svg";
import ListIcon from "@/icons/list.svg";
import Search from "@/icons/search.svg";
import UserIcon from "@/icons/user.svg";
import MapIcon from "@/icons/map.svg";
import ENIcon from "@/icons/lang/en.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { getFilterCount, hasActiveFilters } from "@/lib/utils/filterUtils";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { ViewModeToggle } from "@/components/Menu/ViewModeToggle";

const menuItems = [
	{
		id: "map",
		icon: MapIcon,
		label: "map.title",
		showInMobile: false,
		showInAccount: true,
		showInMap: true,
	},
	{
		id: "list",
		icon: ListIcon,
		label: "listView.title",
		showInMobile: false,
		showInAccount: true,
		showInMap: true,
	},
	{
		id: "filter",
		icon: FilterLines,
		label: "filter.title",
		showInMobile: true,
		showInAccount: false,
		showInMap: true,
	},
	{
		id: "search",
		icon: Search,
		label: "search.title",
		showInMobile: true,
		showInAccount: false,
		showInMap: true,
	},
	{
		id: "add",
		icon: Edit,
		label: "add.title",
		showInMobile: true,
		showInAccount: true,
		showInMap: true,
	},
	{
		id: "download",
		icon: Download,
		label: "download.title",
		showInMobile: true,
		showInAccount: false,
		showInMap: true,
	},
] as const;

const footerItems = [
	{ id: "info", icon: InfoCircle, label: "info.title" },
	{ id: "accessibility", icon: Accessibility, label: "accessibility.title" },
	{ id: "language", icon: ENIcon, label: "language.title" },
	{ id: "user", icon: UserIcon, label: "user.title" },
] as const;

const mapMenuItemIds: Set<string> = new Set(
	menuItems.filter((item) => item.showInMap).map((item) => item.id),
);

export function Menu({
	sidebar,
	...props
}: React.ComponentProps<typeof Sidebar> & { sidebar: React.ReactNode }) {
	const { toggleSidebar, setOpen, setOpenMobile, isMobile, open, openMobile } =
		useSidebar();
	const { t } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();
	const lastMapRouteRef = useRef("/map");
	const isAccountRoute = pathname?.includes("/account") ?? false;
	const filters = useInstitutionStore((state) => state.filters);
	const filteredInstitutions = useInstitutionStore(
		(state) => state.filteredInstitutions,
	);
	const {
		setFirstTimeUser,
		activePanel,
		setActivePanel,
		isLayerTreeOpen,
		setIsLayerTreeOpen,
	} = useAppStore();

	const filterCount = getFilterCount(filters);
	const mapLabel = t("map.title");
	const listLabel = t("listView.title");

	useEffect(() => {
		if (pathname?.endsWith("/map")) {
			lastMapRouteRef.current = "/map";
		} else if (pathname?.endsWith("/list")) {
			lastMapRouteRef.current = "/list";
		}
	}, [pathname]);

	const normalizedPath = useMemo(
		() => pathname?.replace(/\/$/, "") ?? "",
		[pathname],
	);

	const activeItem = useMemo(() => {
		if (!normalizedPath) return "";
		if (normalizedPath.includes("/institution/")) return "institution-detail";
		if (isLayerTreeOpen) return "layertree";
		if (activePanel) return activePanel;
		return "";
	}, [activePanel, isLayerTreeOpen, normalizedPath]);

	useEffect(() => {
		if (isAccountRoute) {
			setOpen(false);
			setOpenMobile(false);
		}
	}, [isAccountRoute, setOpen, setOpenMobile]);

	useEffect(() => {
		if (isAccountRoute) return;
		if (activeItem !== "institution-detail") {
			setOpen(false);
			setOpenMobile(false);
			return;
		}

		if (isMobile) {
			setOpenMobile(true);
		} else {
			setOpen(true);
		}
	}, [activeItem, isAccountRoute, isMobile, setOpen, setOpenMobile]);

	useEffect(() => {
		setOpen(false);
		setOpenMobile(false);
	}, [isMobile]);

	const closeSidebar = () => {
		setOpen(false);
		setOpenMobile(false);
	};

	const openSidebarForItem = (itemName: string) => {
		if (isMobile) {
			setOpenMobile(true);
		} else {
			setOpen(true);
		}
	};

	const handleLogoClick = () => {
		router.push("/map");
		setFirstTimeUser(true);
		router.push("/welcome");
	};

	const handleBackToMapRoute = () => {
		closeSidebar();
		router.push(lastMapRouteRef.current);
	};

	const handleAccountRouteSwitch = (target: "map" | "list") => {
		closeSidebar();
		router.push(target === "map" ? "/map" : "/list");
	};

	const handleItemClick = (itemName: string) => {
		if (isAccountRoute && mapMenuItemIds.has(itemName)) {
			handleBackToMapRoute();
			return;
		}

		switch (itemName) {
			case "map":
				handleAccountRouteSwitch("map");
				return;
			case "list":
				handleAccountRouteSwitch("list");
				return;
			case "info":
				if (isAccountRoute) {
					closeSidebar();
				}
				router.push("/info");
				return;
			case "accessibility":
				router.push("/accessibility");
				return;
			case "user":
				router.push("/account");
				return;
			case "add":
				router.push("/institution");
				return;
			case "download":
				router.push("/download");
				return;
			case "layertree":
				setIsLayerTreeOpen(!isLayerTreeOpen);
				return;
			case "filter":
				setActivePanel(activePanel === "filter" ? null : "filter");
				return;
			case "search":
				setActivePanel(activePanel === "search" ? null : "search");
				return;
			default:
				break;
		}

		if (activeItem === itemName) {
			if (
				itemName === "filter" ||
				itemName === "search" ||
				itemName === "layertree"
			) {
				router.push(lastMapRouteRef.current);
				return;
			}
			if (isMobile) {
				closeSidebar();
			} else {
				toggleSidebar();
			}
			return;
		}

		openSidebarForItem(itemName);
	};

	const shouldShowDownloadButton = () => {
		return (
			activeItem === "institution-detail" ||
			(activeItem === "filter" && hasActiveFilters(filters))
		);
	};

	const handleDownloadButtonClick = () => {
		router.push("/download");
	};

	const getDownloadButtonCount = () => {
		if (activeItem === "institution-detail") {
			return 1;
		}
		if (
			activeItem === "filter" &&
			filteredInstitutions &&
			hasActiveFilters(filters)
		) {
			return filteredInstitutions.length;
		}
		return null;
	};

	const isListRoute = useMemo(
		() =>
			normalizedPath.endsWith("/list") ||
			(normalizedPath.includes("/institution/") &&
				lastMapRouteRef.current.endsWith("/list")),
		[normalizedPath],
	);

	return (
		<>
			<nav aria-label={t("menu.navigation")}>
				<Sidebar
					collapsible="icon"
					className="overflow-hidden *:data-[sidebar=sidebar]:flex-row [&_*]:!transition-none"
					{...props}
				>
					<Sidebar
						collapsible="none"
						className="w-[var(--sidebar-width-icon)] min-w-[var(--sidebar-width-icon)] max-w-[var(--sidebar-width-icon)] flex-shrink-0 border-r justify-center hidden md:flex"
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
												const showBadge =
													filterCount > 0 && item.id === "filter";
												const active = activeItem === item.id;
												return (
													<SidebarMenuItem key={item.id}>
														<SidebarMenuButton
															tooltip={{
																children: t(item.label),
																hidden: false,
															}}
															onClick={() => handleItemClick(item.id)}
															isActive={active}
															aria-label={
																showBadge
																	? t("menu.menuButtonBadge", {
																			label: t(item.label),
																			count: filterCount,
																		})
																	: t(item.label)
															}
															aria-current={active}
															className="relative"
														>
															<item.icon />
															{showBadge && (
																<div className="absolute top-2 -right-1 bg-primary text-primary-foreground body2 rounded-full min-w-5 h-5 flex items-center justify-center px-1">
																	{filterCount}
																</div>
															)}
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
								{footerItems.map((item) => (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											tooltip={{
												children: t(item.label),
												hidden: false,
											}}
											onClick={() => handleItemClick(item.id)}
											isActive={
												item.id === "info"
													? normalizedPath.includes("/info")
													: item.id === "accessibility"
														? normalizedPath.includes("/accessibility")
														: item.id === "user"
															? isAccountRoute
															: false
											}
											aria-label={t(item.label)}
										>
											<item.icon />
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarFooter>
					</Sidebar>

					{/* This is the second sidebar */}
					{/* We disable collapsible and let it fill remaining space */}
					<Sidebar
						collapsible="none"
						className="flex-1 h-full group-data-[collapsible=icon]:hidden flex flex-col"
					>
						<SidebarContent className="flex-1 overflow-hidden">
							<SidebarGroup className="px-0 h-full">
								<SidebarGroupContent className="h-full overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-interaction-dark focus-visible:outline-offset-[-2px]">
									<div className="min-h-full flex flex-col">
										<div className="flex-1 h-full bg-neutral-10 md:bg-secondary">
											<div
												aria-hidden={
													activeItem === "institution-detail"
														? isListRoute
														: false
												}
												tabIndex={
													activeItem === "institution-detail" && isListRoute
														? -1
														: undefined
												}
											>
												{sidebar}
											</div>
										</div>
										{shouldShowDownloadButton() && false && (
											<div className="sticky bottom-0 flex justify-center p-4">
												<Button
													variant={"outline"}
													className="w-full"
													aria-label={t("download.downloadButton")}
													onClick={handleDownloadButtonClick}
												>
													<Download size={6} viewBox="0 0 24 24" />
													{t("download.downloadButton")}
													{getDownloadButtonCount() && (
														<span>({getDownloadButtonCount()})</span>
													)}
												</Button>
											</div>
										)}
									</div>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
				</Sidebar>
			</nav>
			<div className="absolute md:hidden block z-[50] top-0 left-0">
				<button
					onClick={handleLogoClick}
					className="flex flex-col items-center gap-1 p-2 "
					aria-label={t("kukaLogo")}
				>
					<KukaSmallLogo
						title="Kulturkataster Berlin, Logo"
						className="size-14"
					/>
				</button>
			</div>

			{/* <ViewModeToggle /> */}

			<div className="fixed bottom-0 left-0 right-0 z-[60] bg-sidebar border-t md:hidden h-20 pointer-events-auto">
				<SidebarMenu className="flex-row justify-around px-2 py-3">
					{menuItems
						.filter((item) => item.showInMobile)
						.map((item) => {
							const showBadge = filterCount > 0 && item.id === "filter";
							return (
								<SidebarMenuItem key={item.id} className="flex-shrink-0">
									<SidebarMenuButton
										onClick={() => handleItemClick(item.id)}
										isActive={activeItem === item.id}
										className="flex-col gap-1 h-auto py-2 px-2 w-auto size-12"
										aria-label={t(item.label)}
									>
										<item.icon className="size-6" />
										<span className="text-xs font-medium hidden">
											{t(item.label)}
										</span>
										{showBadge && (
											<div className="absolute -top-1 -right-1 bg-primary text-primary-foreground body2 rounded-full min-w-5 h-5 flex items-center justify-center px-1">
												{filterCount}
											</div>
										)}
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
				</SidebarMenu>
			</div>
		</>
	);
}
