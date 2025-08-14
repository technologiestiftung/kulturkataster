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
import Close from "@/icons/close.svg";
import DotsVertical from "@/icons/dots-vertical.svg";
import Download from "@/icons/download.svg";
import Edit from "@/icons/edit.svg";
import FilterLines from "@/icons/filter-lines.svg";
import InfoCircle from "@/icons/info-circle.svg";
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
	const { setInformationModalOpen } = useModalStore();
	const isLayerTreeOpen = useMapStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useMapStore((state) => state.setIsLayerTreeOpen);
	const selectedInstitutionId = useInstitutionStore(
		(state) => state.selectedInstitutionId,
	);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);
	const filters = useInstitutionStore((state) => state.filters);
	const institutions = useInstitutionStore((state) => state.institutions);
	const { firstTimeUser, setFirstTimeUser } = useAppStore();

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

	return (
		<>
			<WelcomeModal
				open={firstTimeUser}
				onOpenChange={handleWelcomeModalClose}
			/>
			{/* InformationModal now handled by ModalProvider */}
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
											>
												<item.icon />
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
					className="flex-1 h-full group-data-[collapsible=icon]:hidden"
				>
					<SidebarHeader className="gap-3.5 p-6 shadow-sm md:shadow-none z-10">
						<div className="md:hidden flex justify-center pb-2">
							<div className="w-10 h-1 bg-muted-foreground/30 rounded-full"></div>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{activeItem === "institution-detail" && previousActiveItem && (
									<button
										onClick={handleBackToFilter}
										className="body1 font-bold flex items-center gap-1"
										aria-label={`Zurück zu ${t(previousActiveItem + ".title")}`}
									>
										← Zurück zu {t(previousActiveItem + ".title")}
									</button>
								)}
								{!(
									activeItem === "institution-detail" && previousActiveItem
								) && (
									<span className="body1 font-bold">
										{(() => {
											if (!activeItem) return;
											if (activeItem === "layertree") return "Fachkarten";
											if (activeItem === "institution-detail")
												return t("institution.details");
											return t(activeItem + ".title");
										})()}
									</span>
								)}
							</div>
							<button
								onClick={handleSidebarClose}
								aria-label={t("closeSidebar")}
							>
								<Close />
							</button>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup className="px-0 h-full">
							<SidebarGroupContent className="h-full overflow-auto">
								<div className="min-h-full flex flex-col">
									<div className="flex-1">
										{activeItem === "filter" && <FilterContent />}
										{activeItem === "search" && <SearchContent />}
										{activeItem === "accessibility" && (
											<AccessibilityContent onItemClick={handleItemClick} />
										)}
										{activeItem === "layertree" && <LayerTreeContent />}
										{activeItem === "institution-detail" && (
											<InstitutionDetailContent />
										)}
									</div>
									{(activeItem === "institution-detail" ||
										(activeItem === "filter" && hasActiveFilters(filters))) && (
										<div className="sticky bottom-0 flex justify-center p-4">
											<Button
												variant={"outline"}
												className="w-full"
												aria-label={t("download.downloadButton")}
											>
												<Download size={6} viewBox="0 0 24 24" />
												Daten herunterladen{" "}
												{institutions && (
													<span>({institutions.features.length})</span>
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

			<div className="absolute md:hidden block z-[50] top-0 right-0 p-4 overflow-hidden">
				<Button
					variant="map-icon"
					size="icon-only"
					title={t("info.open")}
					onClick={() => setInformationModalOpen(true)}
					aria-label={t("info.open")}
				>
					<DotsVertical size={14} />
				</Button>
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
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</div>
		</>
	);
}
