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
import ArrowLeft from "@/icons/arrow-narrow-left.svg";
import Close from "@/icons/close.svg";
import Download from "@/icons/download.svg";
import Edit from "@/icons/edit.svg";
import FilterLines from "@/icons/filter-lines.svg";
import InfoCircle from "@/icons/info-circle.svg";
import ListIcon from "@/icons/list.svg";
import Search from "@/icons/search.svg";
import UserIcon from "@/icons/user.svg";
import MapIcon from "@/icons/map.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { getFilterCount, hasActiveFilters } from "@/lib/utils/filterUtils";
import { animateMapToCoordinates } from "@/lib/utils/mapUtils";
import { getCoordinatesFromAddress } from "@/lib/utils/institutionUtils";
import { fromLonLat } from "ol/proj";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { LayerTreeContent } from "../Map/LayerTree/LayerTree";
import { AccessibilityContent } from "./MenuContent/AccessibilityContent";
import { FilterContent } from "./MenuContent/FilterContent";
import { InstitutionDetailContent } from "./MenuContent/InstitutionDetailContent";
import { SearchContent } from "./MenuContent/SearchContent";
import { ViewModeToggle } from "@/components/Menu/ViewModeToggle";

const menuItems = [
	{ id: "filter", icon: FilterLines, label: "filter.title" },
	{ id: "search", icon: Search, label: "search.title" },
	{ id: "add", icon: Edit, label: "add.title" },
	{ id: "download", icon: Download, label: "download.title" },
] as const;

const footerItems = [
	{ id: "info", icon: InfoCircle, label: "info.title" },
	{ id: "accessibility", icon: Accessibility, label: "accessibility.title" },
	{ id: "language", icon: MapIcon, label: "language.title" },
	{ id: "user", icon: UserIcon, label: "user.title" },
] as const;

const mapMenuItemIds = new Set(menuItems.map((item) => item.id));

export function Menu({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { toggleSidebar, setOpen, setOpenMobile, isMobile, open, openMobile } =
		useSidebar();
	const { t } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();
	const lastMapRouteRef = useRef("/map");
	const isAccountRoute = pathname?.includes("/account") ?? false;
	const [activeItem, setActiveItem] = useState<string>("");
	const [previousActiveItem, setPreviousActiveItem] = useState<string>("");
	const [userHasClosedSidebar, setUserHasClosedSidebar] = useState(false);
	const isLayerTreeOpen = useMapStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useMapStore((state) => state.setIsLayerTreeOpen);
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);
	const filters = useInstitutionStore((state) => state.filters);
	const institutions = useInstitutionStore((state) => state.allInstitutions);
	const filteredInstitutions = useInstitutionStore(
		(state) => state.filteredInstitutions,
	);
	const { firstTimeUser, setFirstTimeUser } = useAppStore();

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

	useEffect(() => {
		if (
			!isMobile &&
			!firstTimeUser &&
			!userHasClosedSidebar &&
			!isAccountRoute
		) {
			setActiveItem("filter");
			setOpen(true);
		}
	}, [isMobile, firstTimeUser, setOpen, userHasClosedSidebar, isAccountRoute]);

	useEffect(() => {
		if (isAccountRoute) {
			setActiveItem("");
			setOpen(false);
			setOpenMobile(false);
		}
	}, [isAccountRoute, setOpen, setOpenMobile]);

	useEffect(() => {
		if (isLayerTreeOpen) {
			setActiveItem("layertree");
		}
	}, [isLayerTreeOpen]);

	useEffect(() => {
		if (selectedInstitutionId) {
			if (activeItem && activeItem !== "institution-detail") {
				setPreviousActiveItem(activeItem);
			}
			setActiveItem("institution-detail");
			if (isMobile) {
				setOpenMobile(true);
			} else {
				setOpen(true);
			}
		} else if (activeItem === "institution-detail") {
			setActiveItem(previousActiveItem);
		}
	}, [
		selectedInstitutionId,
		isMobile,
		setOpen,
		setOpenMobile,
		activeItem,
		previousActiveItem,
	]);

	useEffect(() => {
		const isSidebarClosed = isMobile ? !openMobile : !open;
		if (isSidebarClosed && !isMobile) {
			setActiveItem("");
		}
	}, [open, openMobile, isMobile]);

	useEffect(() => {
		setOpen(false);
		setOpenMobile(false);
		setIsLayerTreeOpen(false);
	}, [isMobile]);

	const closeSidebar = () => {
		setActiveItem("");
		setOpen(false);
		setOpenMobile(false);
	};

	const openSidebarForItem = (itemName: string) => {
		setActiveItem(itemName);
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

	const handleSidebarClose = () => {
		setUserHasClosedSidebar(true);
		if (activeItem === "institution-detail") {
			setSelectedInstitutionId(null);
		}
		if (activeItem === "layertree") {
			setIsLayerTreeOpen(false);
		}
		closeSidebar();
	};

	const handleBackToFilter = () => {
		setSelectedInstitutionId(null);
		setActiveItem(previousActiveItem);
	};

	const handleItemClick = (itemName: string) => {
		if (isAccountRoute && mapMenuItemIds.has(itemName)) {
			handleBackToMapRoute();
			return;
		}

		switch (itemName) {
			case "info":
				if (isAccountRoute) {
					closeSidebar();
				}
				router.push("/info");
				return;
			case "user":
				router.push("/account");
				return;
			case "add":
				window.open(
					"https://form.formcentric.com/form/fb8189d9-8887-425d-bdd5-4aec08f7d8d5",
					"_blank",
				);
				return;
			case "download":
				router.push("/download");
				return;
			case "layertree":
				if (isLayerTreeOpen) {
					setIsLayerTreeOpen(false);
					closeSidebar();
				}
				return;
			default:
				break;
		}

		// Clear selected institution when switching to a different menu item
		if (selectedInstitutionId && itemName !== "institution-detail") {
			setSelectedInstitutionId(null);
		}

		if (activeItem === itemName) {
			if (isMobile) {
				closeSidebar();
			} else {
				toggleSidebar();
			}
			return;
		}

		openSidebarForItem(itemName);
	};

	const getActiveItemTitle = () => {
		if (!activeItem) return "";
		if (activeItem === "layertree") return "Fachkarten";
		if (activeItem === "institution-detail") return t("institution.details");
		return t(activeItem + ".title");
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

	const zoomToSelectedInstitution = () => {
		// Get map directly from store to ensure we have the latest instance
		const currentMap = useMapStore.getState().map;

		if (!selectedInstitutionId || !currentMap || !institutions) return;

		const institution = institutions.find(
			(institution) => institution?.id === selectedInstitutionId,
		);

		if (!institution || !institution.address) return;

		let coordinates: [number, number] | null = getCoordinatesFromAddress(
			institution.address,
		);

		if (coordinates) {
			const transformedCoords = fromLonLat(coordinates);
			animateMapToCoordinates(currentMap, transformedCoords);
		}
	};

	const normalizedPath = useMemo(
		() => pathname?.replace(/\/$/, "") ?? "",
		[pathname],
	);
	const isListRoute = useMemo(
		() => normalizedPath.endsWith("/list"),
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
										{isAccountRoute ? (
											<>
												<SidebarMenuItem>
													<SidebarMenuButton
														tooltip={{
															children: mapLabel,
															hidden: false,
														}}
														onClick={() => handleAccountRouteSwitch("map")}
														aria-label={mapLabel}
													>
														<MapIcon />
													</SidebarMenuButton>
												</SidebarMenuItem>
												<SidebarMenuItem>
													<SidebarMenuButton
														tooltip={{
															children: listLabel,
															hidden: false,
														}}
														onClick={() => handleAccountRouteSwitch("list")}
														aria-label={listLabel}
													>
														<ListIcon />
													</SidebarMenuButton>
												</SidebarMenuItem>
											</>
										) : (
											menuItems.map((item) => {
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
											})
										)}
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
											isActive={activeItem === item.id}
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
						<SidebarHeader className="gap-3.5 p-6 shadow-sm md:shadow-none z-10">
							<div className="md:hidden flex justify-center pb-2">
								<div className="w-10 h-1 bg-muted-foreground/30 rounded-full"></div>
							</div>
							<div className="flex items-center justify-between w-full">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{activeItem === "institution-detail" &&
											previousActiveItem && (
												<button
													onClick={handleBackToFilter}
													className="body1 font-bold flex items-center gap-1 "
													aria-label={t("menu.backToAriaLabel", {
														title: t(previousActiveItem + ".title"),
													})}
												>
													<ArrowLeft className="size-6" />{" "}
													{t("menu.backTo", {
														page: t(previousActiveItem + ".title"),
													})}
												</button>
											)}
										{!(
											activeItem === "institution-detail" && previousActiveItem
										) && (
											<span className="font-bold body3">
												{getActiveItemTitle()}
											</span>
										)}
									</div>
								</div>
								<button
									className=""
									onClick={handleSidebarClose}
									aria-label={t("closeSidebar")}
								>
									<Close />
								</button>
							</div>
						</SidebarHeader>
						<SidebarContent className="flex-1 overflow-hidden">
							<SidebarGroup className="px-0 h-full">
								<SidebarGroupContent className="h-full overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-interaction-dark focus-visible:outline-offset-[-2px]">
									<div className="min-h-full flex flex-col">
										<div className="flex-1 h-full bg-neutral-10 md:bg-secondary">
											{activeItem === "filter" && <FilterContent />}
											{activeItem === "search" && <SearchContent />}
											{activeItem === "accessibility" && (
												<div className="p-2 w-full">
													<AccessibilityContent />
												</div>
											)}
											{activeItem === "layertree" && <LayerTreeContent />}
											{activeItem === "institution-detail" && (
												<div
													aria-hidden={isListRoute}
													tabIndex={isListRoute ? -1 : undefined}
												>
													<InstitutionDetailContent />
												</div>
											)}
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

			<ViewModeToggle />

			<div className="fixed bottom-0 left-0 right-0 z-[60] bg-sidebar border-t md:hidden h-20 pointer-events-auto">
				<SidebarMenu className="flex-row justify-around px-2 py-3">
					{menuItems.map((item) => {
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
