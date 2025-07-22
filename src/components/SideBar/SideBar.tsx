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
import SignLanguage from "@/icons/sign-language.svg";
import SimpleLanguage from "@/icons/simple-language.svg";
import FontSize from "@/icons/font-size.svg";
import Contrast from "@/icons/contrast.svg";
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
import { WelcomeModal } from "@/components/WelcomeModal";
import { InformationModal } from "@/components/InformationModal";
import { useTranslation } from "react-i18next";
import "@/i18n/client";
import GeolocationSearch from "../GeolocationSearch/GeolocationSearch";

export function SideBar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { toggleSidebar, setOpen } = useSidebar();
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
			toggleSidebar();
		} else {
			setActiveItem(itemName);
			setOpen(true);
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
					className="w-[var(--sidebar-width-icon)] min-w-[var(--sidebar-width-icon)] max-w-[var(--sidebar-width-icon)] flex-shrink-0 border-r flex justify-center"
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
									<SidebarMenuItem>
										<SidebarMenuButton
											tooltip={{
												children: t("filter"),
												hidden: false,
											}}
											onClick={() => handleItemClick("filter")}
											isActive={activeItem === "filter"}
										>
											<FilterLines />
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton
											tooltip={{
												children: t("search.title"),
												hidden: false,
											}}
											onClick={() => handleItemClick("search")}
											isActive={activeItem === "search"}
										>
											<Search />
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton
											tooltip={{
												children: t("add"),
												hidden: false,
											}}
											onClick={() => handleItemClick("add")}
											isActive={activeItem === "add"}
										>
											<Edit />
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton
											tooltip={{
												children: t("download"),
												hidden: false,
											}}
											onClick={() => handleItemClick("download")}
											isActive={activeItem === "download"}
										>
											<Download />
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									tooltip={{
										children: t("info"),
										hidden: false,
									}}
									onClick={() => handleItemClick("info")}
									isActive={activeItem === "info"}
								>
									<InfoCircle />
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									tooltip={{
										children: t("accessibility"),
										hidden: false,
									}}
									onClick={() => handleItemClick("accessibility")}
									isActive={activeItem === "accessibility"}
								>
									<Accessibility />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				</Sidebar>

				{/* This is the second sidebar */}
				{/* We disable collapsible and let it fill remaining space */}
				<Sidebar
					collapsible="none"
					className="hidden flex-1 md:flex group-data-[collapsible=icon]:hidden"
				>
					<SidebarHeader className="gap-3.5 p-6">
						<div className="flex items-center justify-between w-full">
							<span className="body1 font-bold">
								{t(activeItem + ".title") || t(activeItem)}
							</span>
							<Close />
						</div>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup className="px-0">
							<SidebarGroupContent>
								<div className="">
									{activeItem === "filter" && <p>{t("filterDescription")}</p>}
									{activeItem === "search" && (
										<div className="space-y-4 flex flex-col p-6">
											<GeolocationSearch />
											<p>{t("search.description")}</p>
											<p className="text-sm text-muted-foreground">
												{t("search.hint")}
											</p>
										</div>
									)}
									{activeItem === "accessibility" && (
										<div className="space-y-4 flex flex-col p-2">
											<SidebarMenuItem
												onClick={() => handleItemClick("accessibility")}
												className="flex items-center justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground p-2 rounded-md h-20"
											>
												<SignLanguage className="size-8" />
												<span className="body2 font-bold">
													{t("accessibility.signLanguage.title")}
												</span>
											</SidebarMenuItem>
											<SidebarMenuItem
												onClick={() => handleItemClick("accessibility")}
												className="flex items-center justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground p-2 rounded-md h-20"
											>
												<SimpleLanguage className="size-8" />
												<span className="body2 font-bold">
													{t("accessibility.simpleLanguage.title")}
												</span>
											</SidebarMenuItem>
											<SidebarMenuItem
												onClick={() => handleItemClick("accessibility")}
												className="flex items-center justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground p-2 rounded-md h-20"
											>
												<FontSize className="size-8" />
												<span className="body2 font-bold">
													{t("accessibility.fontSize.title")}
												</span>
											</SidebarMenuItem>
											<SidebarMenuItem
												onClick={() => handleItemClick("accessibility")}
												className="flex items-center justify-start gap-2 bg-background hover:bg-accent hover:text-accent-foreground p-2 rounded-md h-20"
											>
												<Contrast className="size-8" />
												<span className="body2 font-bold">
													{t("accessibility.contrast.title")}
												</span>
											</SidebarMenuItem>
										</div>
									)}
								</div>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
				</Sidebar>
			</Sidebar>
		</>
	);
}
