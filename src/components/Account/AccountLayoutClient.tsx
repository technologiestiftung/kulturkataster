"use client";

import { useTransition, type ReactNode } from "react";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Setting from "@/icons/settings.svg";
import Info from "@/icons/info-circle.svg";
import { logout } from "@/server/actions/auth";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { Profile } from "@/types";
import { clearAccountStore } from "@/lib/store/accountStore";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

type TabConfig = {
	value: string;
	path: string;
	labelKey: string;
	defaultLabel: string;
};

const TAB_CONFIGS: TabConfig[] = [
	{
		value: "activity",
		path: "/activity",
		labelKey: "auth.account.tabs.activity",
		defaultLabel: "Activity",
	},
	{
		value: "institutions",
		path: "/institutions",
		labelKey: "auth.account.tabs.institutions",
		defaultLabel: "Institutions",
	},
	{
		value: "users",
		path: "/users",
		labelKey: "auth.account.tabs.users",
		defaultLabel: "Users",
	},
	{
		value: "groups",
		path: "/groups",
		labelKey: "auth.account.tabs.groups",
		defaultLabel: "Groups",
	},
	{
		value: "roles",
		path: "/roles",
		labelKey: "auth.account.tabs.roles",
		defaultLabel: "Roles",
	},
	{
		value: "categories",
		path: "/categories",
		labelKey: "auth.account.tabs.categories",
		defaultLabel: "Categories",
	},
];

type AccountLayoutClientProps = {
	children: ReactNode;
	currentProfile: Profile | null;
	allowedTabs: string[];
};

export function AccountLayoutClient({
	children,
	currentProfile,
	allowedTabs,
}: AccountLayoutClientProps) {
	const { t } = useTranslation("common");
	const router = useRouter();
	const [isRefreshing, startRefreshTransition] = useTransition();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();

	const visibleTabs = TAB_CONFIGS.filter((tab) =>
		allowedTabs.includes(tab.value),
	).map((tab) => ({
		...tab,
		label: t(tab.labelKey, { defaultValue: tab.defaultLabel }),
	}));

	const getCurrentTab = () => {
		if (allowedTabs.length === 0) return "";
		return (
			visibleTabs.find((tab) => pathname.includes(tab.path))?.value ??
			allowedTabs[0]
		);
	};

	const handleTabChange = (value: string) => {
		if (!allowedTabs.includes(value)) return;
		router.push(toLocalePath(`/account/${value}`));
	};

	const handleLogout = async () => {
		const result = await logout();
		if (result.ok) {
			await clearAccountStore();
			router.push(toLocalePath("/"));
		} else {
			reportClientTelemetry({
				level: "error",
				event: "account.logout.failed",
				error: result.error,
			});
		}
	};

	const profileSettingsLabel = t("auth.account.actions.profileSettings", {
		defaultValue: "Profile settings",
	});
	const faqLabel = t("auth.account.actions.faq", { defaultValue: "FAQ" });
	const logoutLabel = t("auth.account.actions.logout", {
		defaultValue: "Logout",
	});
	const refreshLabel = t("auth.account.actions.refreshData", {
		defaultValue: "Refresh data",
	});

	return (
		<div className="AccountLayoutClient relative min-h-0 h-full z-30">
			<div className="absolute h-full w-full">
				<Image
					src="/resources/map.png"
					alt="Map background"
					fill
					className="object-cover object-top-left contrast:invert-90"
					priority
				/>
			</div>
			<div className="absolute flex h-full w-full flex-col">
				<div className="space-y-6 p-10 shrink-0">
					<div className="mt-16">
						<h1 className="text-3xl font-bold">
							{t("auth.account.welcome", {
								name: `${`${currentProfile?.first_name} ${currentProfile?.last_name}`.trim() || currentProfile?.email || ""}`,
							})}
						</h1>
						<p className="body1 font-bold">
							{t("auth.account.subtitle", {
								defaultValue: "Manage your account settings and preferences.",
							})}
						</p>
					</div>
					<div className="Buttons flex flex-wrap space-x-3">
						<ButtonWithTooltip
							radius="full"
							variant="surface"
							iconSize="lg"
							tooltip={profileSettingsLabel}
							tooltipSide="bottom"
							className="h-14 w-14"
							aria-label={profileSettingsLabel}
							onClick={() => router.push(toLocalePath("/account/edit"))}
						>
							<Setting />
						</ButtonWithTooltip>
						<ButtonWithTooltip
							radius="full"
							variant="surface"
							iconSize="lg"
							tooltipSide="bottom"
							tooltip={faqLabel}
							className="h-14 w-14"
							aria-label={faqLabel}
							onClick={() => router.push(toLocalePath("/account/faq"))}
						>
							<Info />
						</ButtonWithTooltip>
						<ButtonWithTooltip
							radius="full"
							variant="surface"
							iconSize="lg"
							tooltipSide="bottom"
							tooltip={logoutLabel}
							className="h-14 w-14"
							aria-label={logoutLabel}
							onClick={handleLogout}
						>
							<LogOut />
						</ButtonWithTooltip>
						<ButtonWithTooltip
							radius="full"
							variant="surface"
							iconSize="lg"
							tooltipSide="bottom"
							tooltip={refreshLabel}
							className="h-14 w-14"
							aria-label={refreshLabel}
							disabled={isRefreshing}
							onClick={() => {
								startRefreshTransition(() => {
									router.refresh();
								});
							}}
						>
							<RefreshCw
								className={
									isRefreshing ? "motion-safe:animate-spin" : undefined
								}
							/>
						</ButtonWithTooltip>
					</div>
				</div>
				<div className="Account-section flex flex-col min-h-0 flex-1">
					<Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
						<TabsList className="px-10">
							{visibleTabs.map((tab) => (
								<TabsTrigger key={tab.value} value={tab.value}>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>

					<div className="pt-6 flex-1 min-h-0 w-full bg-background">
						<div
							key={pathname}
							className="h-full motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
						>
							{children}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
