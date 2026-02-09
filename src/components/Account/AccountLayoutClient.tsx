"use client";

import type { ReactNode } from "react";
import { ButtonWithTooltip } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Setting from "@/icons/settings.svg";
import Edit from "@/icons/edit.svg";
import { logout } from "@/server/actions/auth";
import { AccountAlertDialog } from "@/components/Account/AccountAlertDialog";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Profile } from "@/types";

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
	const toLocalePath = useLocalePath();
	const pathname = usePathname();

	const getCurrentTab = () => {
		if (allowedTabs.length === 0) return "";
		if (pathname.includes("/profile")) return "profile";
		if (pathname.includes("/settings")) return "settings";
		if (pathname.includes("/users")) return "users";
		if (pathname.includes("/groups")) return "groups";
		if (pathname.includes("/roles")) return "roles";
		if (pathname.includes("/categories")) return "categories";
		if (pathname.includes("/activity")) return "activity";
		if (pathname.includes("/institutions")) return "institutions";
		return allowedTabs[0];
	};

	const handleTabChange = (value: string) => {
		if (!allowedTabs.includes(value)) return;
		router.push(toLocalePath(`/account/${value}`));
	};

	const handleLogout = async () => {
		const result = await logout();
		if (result.ok) {
			router.push(toLocalePath("/"));
		} else {
			console.error("Logout failed:", result.error);
		}
	};
	const profileSettingsLabel = t("auth.account.actions.profileSettings", {
		defaultValue: "Profile settings",
	});
	const faqLabel = t("auth.account.actions.faq", {
		defaultValue: "FAQ",
	});
	const logoutLabel = t("auth.account.actions.logout", {
		defaultValue: "Logout",
	});
	const activityTabLabel = t("auth.account.tabs.activity", {
		defaultValue: "Activity",
	});
	const institutionsTabLabel = t("auth.account.tabs.institutions", {
		defaultValue: "Institutions",
	});
	const usersTabLabel = t("auth.account.tabs.users", {
		defaultValue: "Users",
	});
	const groupsTabLabel = t("auth.account.tabs.groups", {
		defaultValue: "Groups",
	});
	const rolesTabLabel = t("auth.account.tabs.roles", {
		defaultValue: "Roles",
	});
	const categoriesTabLabel = t("auth.account.tabs.categories", {
		defaultValue: "Categories",
	});
	return (
		<div className="AccountLayoutClient relative min-h-0 h-full">
			<div className="absolute h-full w-full">
				<Image
					src="/resources/map.png"
					alt="Map background"
					fill
					className="object-cover"
					priority
				/>
			</div>
			<div className="absolute flex h-full w-full flex-col">
				<AccountAlertDialog />
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
							variant="rounded"
							size="icon-only"
							tooltip={profileSettingsLabel}
							className="h-14 w-14"
							aria-label={profileSettingsLabel}
							onClick={() => router.push(toLocalePath("/account/edit"))}
						>
							<Setting />
						</ButtonWithTooltip>
						<ButtonWithTooltip
							variant="rounded"
							size="icon-only"
							tooltip={faqLabel}
							className="h-14 w-14"
							aria-label={faqLabel}
							onClick={() => router.push(toLocalePath("/account/faq"))}
						>
							<Edit />
						</ButtonWithTooltip>
						<ButtonWithTooltip
							variant="rounded"
							size="icon-only"
							tooltip={logoutLabel}
							className="h-14 w-14"
							aria-label={logoutLabel}
							onClick={handleLogout}
						>
							<LogOut />
						</ButtonWithTooltip>
					</div>
				</div>
				<div className="Account-section flex flex-col min-h-0 flex-1">
					<Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
						<TabsList className="px-10">
							{allowedTabs.includes("activity") && (
								<TabsTrigger value="activity">{activityTabLabel}</TabsTrigger>
							)}
							{allowedTabs.includes("institutions") && (
								<TabsTrigger value="institutions">
									{institutionsTabLabel}
								</TabsTrigger>
							)}
							{allowedTabs.includes("users") && (
								<TabsTrigger value="users">{usersTabLabel}</TabsTrigger>
							)}
							{allowedTabs.includes("groups") && (
								<TabsTrigger value="groups">{groupsTabLabel}</TabsTrigger>
							)}
							{allowedTabs.includes("roles") && (
								<TabsTrigger value="roles">{rolesTabLabel}</TabsTrigger>
							)}
							{allowedTabs.includes("categories") && (
								<TabsTrigger value="categories">
									{categoriesTabLabel}
								</TabsTrigger>
							)}
						</TabsList>
					</Tabs>

					<div className="pt-6 flex-1 min-h-0 w-full bg-background ">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
