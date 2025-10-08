/* eslint-disable complexity */
"use client";

import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";
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
import BurgerMenu from "@/icons/burger-menu-icon.svg";
import Download from "@/icons/download.svg";
import Edit from "@/icons/edit.svg";
import FilterLines from "@/icons/filter-lines.svg";
import InfoCircle from "@/icons/info-circle.svg";
import ListIcon from "@/icons/list.svg";
import MapIcon from "@/icons/map-02.svg";
import Search from "@/icons/search.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { useModalStore } from "@/lib/store/modalStore";
import { hasActiveFilters } from "@/lib/utils/filterUtils";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayerTreeContent } from "../Map/LayerTree/LayerTree";
import { AccessibilityContent } from "./MenuContent/AccessibilityContent";
import { FilterContent } from "./MenuContent/FilterContent";
import { InstitutionDetailContent } from "./MenuContent/InstitutionDetailContent";
import { SearchContent } from "./MenuContent/SearchContent";

const menuItems = [
	{ id: "filter", icon: FilterLines, label: "filter.title" },
	{ id: "search", icon: Search, label: "search.title" },
	{ id: "add", icon: Edit, label: "add.title" },
	{ id: "download", icon: Download, label: "download.title" },
] as const;

const footerItems = [
	{ id: "info", icon: InfoCircle, label: "info.title" },
	{ id: "accessibility", icon: Accessibility, label: "accessibility.title" },
] as const;

export function Menu({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { toggleSidebar, setOpen, setOpenMobile, isMobile, open, openMobile } =
		useSidebar();
	const { t } = useTranslation("common");
	const [activeItem, setActiveItem] = useState<string>("");
	const [previousActiveItem, setPreviousActiveItem] = useState<string>("");
	const [userHasClosedSidebar, setUserHasClosedSidebar] = useState(false);
	const {
		setInformationModalOpen,
		setDownloadModalOpen,
		setDownloadModalMode,
		setMobileMenuModalOpen,
	} = useModalStore();
	const isLayerTreeOpen = useMapStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useMapStore((state) => state.setIsLayerTreeOpen);
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);
	const filters = useInstitutionStore((state) => state.filters);
	const originalInstitutions = useInstitutionStore(
		(state) => state.allInstitutions,
	);
	const institutions = useInstitutionStore(
		(state) => state.filteredInstitutions,
	);
	const { firstTimeUser, setFirstTimeUser, viewMode, setViewMode } =
		useAppStore();

	useEffect(() => {
		if (!isMobile && !firstTimeUser && !userHasClosedSidebar) {
			setActiveItem("filter");
			setOpen(true);
		}
	}, [isMobile, firstTimeUser, setOpen, userHasClosedSidebar]);

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMobile]);

	const handleItemClick = (itemName: string) => {
		if (itemName === "info") {
			setInformationModalOpen(true);
			return;
		}

		if (itemName === "layertree") {
			if (isLayerTreeOpen) {
				setIsLayerTreeOpen(false);
				if (isMobile) {
					setOpenMobile(false);
				} else {
					setOpen(false);
				}
				return;
			}
		}

		if (itemName === "add") {
			/** Open external Link */
			window.open(
				"https://form.formcentric.com/form/fb8189d9-8887-425d-bdd5-4aec08f7d8d5",
				"_blank",
			);
			return;
		}

		if (itemName === "download") {
			setDownloadModalOpen(true);
			setDownloadModalMode("filtered");
			return;
		}

		// Clear selected institution when switching to a different menu item
		if (selectedInstitutionId && itemName !== "institution-detail") {
			setSelectedInstitutionId(null);
		}

		if (activeItem === itemName) {
			if (isMobile) {
				setOpenMobile(false);
				setActiveItem("");
			} else {
				toggleSidebar();
			}
		} else {
			setActiveItem(itemName);
			if (isMobile) {
				setOpenMobile(true);
			} else {
				setOpen(true);
			}
		}
	};

	const handleLogoClick = () => {
		setFirstTimeUser(true);
	};

	const handleWelcomeModalClose = () => {
		setFirstTimeUser(false);
	};

	const handleSidebarClose = () => {
		setUserHasClosedSidebar(true);
		if (activeItem === "institution-detail") {
			setSelectedInstitutionId(null);
		}
		if (activeItem === "layertree") {
			setIsLayerTreeOpen(false);
		}
		setActiveItem("");
		setOpen(false);
		setOpenMobile(false);
	};

	const handleBackToFilter = () => {
		setSelectedInstitutionId(null);
		setActiveItem(previousActiveItem);
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
		setDownloadModalOpen(true);
		const mode = activeItem === "filter" ? "filtered" : "selected";
		setDownloadModalMode(mode);
	};

	const getDownloadButtonCount = () => {
		if (activeItem === "institution-detail") {
			return 1;
		}
		if (activeItem === "filter" && institutions && hasActiveFilters(filters)) {
			return institutions.features.length;
		}
		return null;
	};

	return (
		<>
			<WelcomeModal
				open={firstTimeUser}
				onOpenChange={handleWelcomeModalClose}
			/>
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
						<SidebarMenu className="my-2">
							<SidebarMenuItem>
								<button onClick={handleLogoClick} aria-label={t("kukaLogo")}>
									<KukaSmallLogo className="size-14 cursor-pointer hover:opacity-80 transition-opacity" />
								</button>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu>
									{menuItems.map((item) => (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton
												tooltip={{
													children: t(item.label),
													hidden: false,
												}}
												onClick={() => handleItemClick(item.id)}
												isActive={activeItem === item.id}
												aria-label={t(item.label)}
												className="relative"
											>
												<item.icon />
												{(item.id === "filter" || item.id === "download") &&
													institutions &&
													originalInstitutions?.features.length !==
														institutions.features.length && (
														<div className="absolute top-2 -right-1 bg-primary text-primary-foreground body2 rounded-full min-w-5 h-5 flex items-center justify-center px-1">
															{institutions.features.length}
														</div>
													)}
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
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
												className="body1 font-bold flex items-center gap-1"
												aria-label={`Zurück zu ${t(previousActiveItem + ".title")}`}
											>
												<ArrowLeft /> Zurück zu{" "}
												{t(previousActiveItem + ".title")}
											</button>
										)}
									{!(
										activeItem === "institution-detail" && previousActiveItem
									) && (
										<span className="body1 font-bold">
											{getActiveItemTitle()}
										</span>
									)}
								</div>
							</div>
							<button
								onClick={handleSidebarClose}
								aria-label={t("closeSidebar")}
							>
								<Close />
							</button>
						</div>
					</SidebarHeader>
					<SidebarContent className="flex-1 overflow-hidden">
						<SidebarGroup className="px-0 h-full">
							<SidebarGroupContent className="h-full overflow-auto">
								<div className="min-h-full flex flex-col">
									<div className="flex-1 h-full">
										{activeItem === "filter" && <FilterContent />}
										{activeItem === "search" && <SearchContent />}
										{activeItem === "accessibility" && (
											<div className="p-2 w-full">
												<AccessibilityContent onItemClick={handleItemClick} />
											</div>
										)}
										{activeItem === "layertree" && <LayerTreeContent />}
										{activeItem === "institution-detail" && (
											<InstitutionDetailContent />
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
			<div className="absolute md:hidden block z-[50] top-0 left-0">
				<button
					onClick={handleLogoClick}
					className="flex flex-col items-center gap-1 p-2"
					aria-label={t("kukaLogo")}
				>
					<KukaSmallLogo className="size-14" />
				</button>
			</div>

			<div className="absolute block z-[50] top-0 right-0 p-4 overflow-hidden">
				<div className="flex gap-2 items-center">
					<div className="relative">
						<div className="flex items-center bg-neutral-80 border rounded-full shadow-sm relative overflow-hidden">
							<div
								className={`absolute top-0 bottom-0 w-12 h-12 bg-background rounded-full transition-transform duration-300 ease-in-out ${
									viewMode === "map" ? "translate-x-0" : "translate-x-12"
								}`}
							/>

							<button
								className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 cursor-pointer ${
									viewMode === "map"
										? "text-foreground"
										: "text-background hover:text-background/80"
								}`}
								onClick={() => setViewMode("map")}
								title="Karte anzeigen"
								aria-label="Karte anzeigen"
							>
								<MapIcon size={14} />
							</button>

							<button
								className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 cursor-pointer ${
									viewMode === "list"
										? "text-foreground"
										: "text-white hover:text-white/80"
								}`}
								onClick={() => setViewMode("list")}
								title="Liste anzeigen"
								aria-label="Liste anzeigen"
							>
								<ListIcon size={14} />
							</button>
						</div>
					</div>

					<Button
						variant="map-icon"
						size="icon-only"
						title={t("mobileMenu.title")}
						onClick={() => setMobileMenuModalOpen(true)}
						aria-label={t("mobileMenu.title")}
						className="md:hidden"
					>
						<DotsVertical size={14} />
					</Button>
				</div>
			</div>

			<div className="fixed bottom-0 left-0 right-0 z-[60] bg-sidebar border-t md:hidden h-20 pointer-events-auto">
				<SidebarMenu className="flex-row justify-around px-2 py-3">
					{menuItems.map((item) => (
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
								{(item.id === "filter" || item.id === "download") &&
									institutions &&
									originalInstitutions?.features.length !==
										institutions.features.length && (
										<div className="absolute -top-1 -right-1 bg-primary text-primary-foreground body2 rounded-full min-w-5 h-5 flex items-center justify-center px-1">
											{institutions.features.length}
										</div>
									)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</div>
		</>
	);
}
