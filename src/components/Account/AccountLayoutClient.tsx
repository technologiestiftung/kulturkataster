"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Setting from "@/icons/user.svg";
import { logout } from "@/server/actions/auth";

type AccountLayoutClientProps = {
	children: ReactNode;
	allowedTabs: string[];
};

export function AccountLayoutClient({
	children,
	allowedTabs,
}: AccountLayoutClientProps) {
	const { t } = useTranslation("common");
	const router = useRouter();
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
		router.push(`/account/${value}`);
	};

	const handleLogout = async () => {
		const result = await logout();
		if (result.ok) {
			router.push("/");
		} else {
			console.error("Logout failed:", result.error);
		}
	};
	return (
		<div>
			<div className="space-y-6 p-10">
				<div className="mt-16">
					<h1 className="text-3xl font-bold"></h1>
					<p className="text-foreground mt-2"></p>
				</div>
				<div className="Buttons flex flex-wrap space-x-3">
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Edit Profile"
						onClick={() => router.push("/account/editProfile")}
					>
						<Setting />
					</Button>
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Settings"
					>
						<Setting />
					</Button>
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Settings"
					>
						<Setting />
					</Button>
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Logout"
						onClick={handleLogout}
					>
						<Setting />
					</Button>
				</div>
			</div>
			<div className="Account-section py-10">
				<Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
					<TabsList className="px-10">
						{allowedTabs.includes("activity") && (
							<TabsTrigger value="activity">
								{t("account.activity", { defaultValue: "Activity" })}
							</TabsTrigger>
						)}
						{allowedTabs.includes("institutions") && (
							<TabsTrigger value="institutions">
								{t("account.institutions", { defaultValue: "Institutions" })}
							</TabsTrigger>
						)}
						{allowedTabs.includes("users") && (
							<TabsTrigger value="users">
								{t("account.users", { defaultValue: "Users" })}
							</TabsTrigger>
						)}
						{allowedTabs.includes("groups") && (
							<TabsTrigger value="groups">
								{t("account.groups", { defaultValue: "Groups" })}
							</TabsTrigger>
						)}
						{allowedTabs.includes("roles") && (
							<TabsTrigger value="roles">
								{t("account.roles", { defaultValue: "Roles" })}
							</TabsTrigger>
						)}
						{allowedTabs.includes("categories") && (
							<TabsTrigger value="categories">
								{t("account.categories", { defaultValue: "Categories" })}
							</TabsTrigger>
						)}
					</TabsList>
				</Tabs>

				<div className="mt-6">{children}</div>
			</div>
		</div>
	);
}
