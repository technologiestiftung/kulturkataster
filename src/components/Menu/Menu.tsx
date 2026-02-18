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
import Accessibility from "@/icons/accessibility.svg";
import Edit from "@/icons/edit.svg";
import InfoCircle from "@/icons/info-circle.svg";
import ListIcon from "@/icons/list.svg";
import UserIcon from "@/icons/user.svg";
import MapIcon from "@/icons/map.svg";
import ENIcon from "@/icons/lang/en.svg";
import Download from "@/icons/download.svg";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useAppStore } from "@/lib/store/appStore";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";

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
		route: "/accessibility",
		matchPattern: /^\/[^/]+\/accessibility/,
		showInMobile: false,
		showInAccount: false,
		showInMap: false,
	},
	{
		id: "language",
		icon: ENIcon,
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

	// Use matchPattern if provided for more flexible matching
	if (item.matchPattern) {
		return item.matchPattern.test(normalizedPath);
	}

	const localizedRoute = toLocalePath(item.route).replace(/\/$/, "");
	return (
		normalizedPath === localizedRoute ||
		normalizedPath.startsWith(`${localizedRoute}/`)
	);
};

export function Menu({
	sidebar,
	...props
}: React.ComponentProps<typeof Sidebar> & { sidebar: React.ReactNode }) {
	const { setOpen, setOpenMobile } = useSidebar();
	const { t } = useTranslation("common");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();
	const { setFirstTimeUser } = useAppStore();

	const normalizedPath = useMemo(
		() => (pathname ? pathname.replace(/\/$/, "") : ""),
		[pathname],
	);

	const currentSidebarInstitutionId = useMemo(() => {
		const match = normalizedPath.match(/\/(?:map|list)\/institution\/(\d+)$/);
		return match?.[1] ?? null;
	}, [normalizedPath]);

	const hasSidebarRoute = useMemo(
		() => Boolean(currentSidebarInstitutionId),
		[currentSidebarInstitutionId],
	);
	const hasSidebarContent = hasSidebarRoute && Boolean(sidebar);

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
		if (!hasSidebarContent) {
			setOpen(false);
			setOpenMobile(false);
			return;
		}
		if (!isAccountRoute) {
			setOpen(true);
		}
	}, [hasSidebarContent, isAccountRoute, setOpen, setOpenMobile]);

	const handleLogoClick = () => {
		setFirstTimeUser(true);
		router.push(toLocalePath("/welcome"));
	};

	const handleItemClick = (item: MenuItem) => {
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
												<item.icon />
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarFooter>
					</Sidebar>

					{hasSidebarContent && (
						<Sidebar
							collapsible="none"
							className="flex-1 h-full group-data-[collapsible=icon]:hidden flex flex-col"
						>
							<SidebarContent className="flex-1 overflow-hidden">
								<SidebarGroup className="px-0 h-full">
									<SidebarGroupContent className="h-full overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-interaction-dark focus-visible:outline-offset-[-2px]">
										<div className="min-h-full flex flex-col">
											<div className="flex-1 h-full bg-neutral-10 md:bg-secondary">
												<div>{sidebar}</div>
											</div>
										</div>
									</SidebarGroupContent>
								</SidebarGroup>
							</SidebarContent>
						</Sidebar>
					)}
				</Sidebar>
			</nav>

			<div className="fixed bottom-0 left-0 right-0 z-51 bg-sidebar border-t md:hidden h-20 pointer-events-auto">
				<SidebarMenu className="flex-row justify-around px-2 py-3">
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
										className="flex-col gap-1 h-auto py-2 px-2 w-auto size-12"
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
		</>
	);
}
