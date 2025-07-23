"use client";

import * as React from "react";
import FilterLines from "@/icons/filter-lines.svg";
import Search from "@/icons/search.svg";
import Edit from "@/icons/edit.svg";
import Download from "@/icons/download.svg";
import InfoCircle from "@/icons/info-circle.svg";
import Accessibility from "@/icons/accessibility.svg";
import KukaMiniLogo from "@/logos/kuka-mini.svg";
import Close from "@/icons/close.svg";
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
import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";
import { InformationModal } from "@/components/Modals/Pages/InformationModal";
import { useTranslation } from "react-i18next";
import "@/i18n/client";
import { FilterContent } from "./MenuContent/FilterContent";
import { SearchContent } from "./MenuContent/SearchContent";
import { AccessibilityContent } from "./MenuContent/AccessibilityContent";

const menuItems = [
	{ id: "filter", icon: FilterLines, label: "filter" },
	{ id: "search", icon: Search, label: "search.title" },
	{ id: "add", icon: Edit, label: "add" },
	{ id: "download", icon: Download, label: "download" },
] as const;

const footerItems = [
	{ id: "info", icon: InfoCircle, label: "info" },
	{ id: "accessibility", icon: Accessibility, label: "accessibility" },
] as const;

export function Menu({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { toggleSidebar, setOpen, setOpenMobile, isMobile } = useSidebar();
	const { t } = useTranslation("common");
	const [activeItem, setActiveItem] = React.useState("filter");
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [infoModalOpen, setInfoModalOpen] = React.useState(false);

	const handleItemClick = (itemName: string) => {
		if (itemName === "info") {
			setInfoModalOpen(true);
			return;
		}

		if (activeItem === itemName) {
			if (isMobile) {
				setOpenMobile(false);
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
		setDialogOpen(true);
	};

	return (
		<>
			<WelcomeModal open={dialogOpen} onOpenChange={setDialogOpen} />
			<InformationModal open={infoModalOpen} onOpenChange={setInfoModalOpen} />
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
								<button onClick={handleLogoClick}>
									<KukaMiniLogo className="size-14 cursor-pointer hover:opacity-80 transition-opacity" />
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
					className="flex-1 w-full h-full group-data-[collapsible=icon]:hidden"
				>
					<SidebarHeader className="gap-3.5 p-6">
						<div className="md:hidden flex justify-center pb-2">
							<div className="w-10 h-1 bg-muted-foreground/30 rounded-full"></div>
						</div>
						<div className="flex items-center justify-between w-full">
							<span className="body1 font-bold">
								{t(activeItem + ".title") || t(activeItem)}
							</span>
							<button onClick={() => setOpen(false)} className="">
								<Close />
							</button>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup className="px-0 h-full">
							<SidebarGroupContent>
								<div className="h-full">
									{activeItem === "filter" && <FilterContent />}
									{activeItem === "search" && <SearchContent />}
									{activeItem === "accessibility" && (
										<AccessibilityContent onItemClick={handleItemClick} />
									)}
								</div>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
				</Sidebar>
			</Sidebar>
			<div className="absolute md:hidden block z-[50] top-0 left-0 right-0 h-40">
				<button
					onClick={handleLogoClick}
					className="flex flex-col items-center gap-1 p-2"
				>
					<KukaMiniLogo className="size-14" />
				</button>
			</div>
			<div className="fixed bottom-0 left-0 right-0 z-[60] bg-sidebar border-t md:hidden h-20">
				<SidebarMenu className="flex-row justify-around px-2 py-3">
					{menuItems.map((item) => (
						<SidebarMenuItem key={item.id} className="flex-shrink-0">
							<SidebarMenuButton
								onClick={() => handleItemClick(item.id)}
								isActive={activeItem === item.id}
								className="flex-col gap-1 h-auto py-2 px-2 w-auto size-12"
							>
								<item.icon className="size-6" />
								<span className="text-xs font-medium hidden">
									{t(item.label)}
								</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
					{/* {footerItems.map((item) => (
						<SidebarMenuItem key={item.id} className="flex-shrink-0">
							<SidebarMenuButton
								onClick={() => handleItemClick(item.id)}
								isActive={activeItem === item.id}
								className="flex-col gap-1 h-auto py-2 px-2 w-auto"
							>
								<item.icon className="size-6" />
								<span className="text-xs font-medium hidden">
									{t(item.label)}
								</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))} */}
				</SidebarMenu>
			</div>
		</>
	);
}
