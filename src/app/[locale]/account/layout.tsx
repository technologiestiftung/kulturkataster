"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Setting from "@/icons/user.svg";

export default function AccountLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { t } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();

	const getCurrentTab = () => {
		if (pathname.includes("/profile")) return "profile";
		if (pathname.includes("/settings")) return "settings";
		if (pathname.includes("/preferences")) return "preferences";
		if (pathname.includes("/users")) return "users";
		if (pathname.includes("/groups")) return "groups";
		if (pathname.includes("/roles")) return "roles";
		return "profile";
	};

	const handleTabChange = (value: string) => {
		router.push(`/account/${value}`);
	};

	return (
		<div className="h-full flex flex-col w-full">
			<div className="space-y-6 p-10">
				<div className="mt-16">
					<h1 className="text-3xl font-bold">Account</h1>
					<p className="text-muted-foreground mt-2">
						Manage your account settings and preferences
					</p>
				</div>
				<div className="Buttons flex flex-wrap space-x-3">
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Edit Profile"
						onClick={() => router.push("/account/editProfile")}
					>
						<Setting className="" />
					</Button>
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Settings"
					>
						<Setting className="" />
					</Button>
					<Button
						variant="rounded"
						size="icon-only"
						className="h-14 w-14"
						aria-label="Settings"
					>
						<Setting className="" />
					</Button>
				</div>
			</div>
			<div className="Account-section w-full py-10 flex flex-col">
				<Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
					<TabsList className="px-10">
						<TabsTrigger value="activity">
							{t("account.activity", { defaultValue: "Activity" })}
						</TabsTrigger>
						<TabsTrigger value="institutions">
							{t("account.institutions", { defaultValue: "Institutions" })}
						</TabsTrigger>
						<TabsTrigger value="preferences">
							{t("account.preferences", { defaultValue: "Preferences" })}
						</TabsTrigger>
						<TabsTrigger value="users">
							{t("account.users", { defaultValue: "Users" })}
						</TabsTrigger>
						<TabsTrigger value="groups">
							{t("account.groups", { defaultValue: "Groups" })}
						</TabsTrigger>
						<TabsTrigger value="roles">
							{t("account.roles", { defaultValue: "Roles" })}
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="mt-6 flex-1 w-full">{children}</div>
			</div>
		</div>
	);
}
