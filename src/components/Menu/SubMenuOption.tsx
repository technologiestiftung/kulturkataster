"use client";

import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

interface SubMenuOptionProps {
	icon: React.ComponentType<{ className?: string }>;
	titleKey: string;
	onClick?: () => void;
	hasSwitch?: boolean;
	switchChecked?: boolean;
	onSwitchChange?: (checked: boolean) => void;
}

export function SubMenuOption({
	icon: Icon,
	titleKey,
	onClick,
	hasSwitch = false,
	switchChecked = false,
	onSwitchChange,
}: SubMenuOptionProps) {
	const { t } = useTranslation("common");

	return (
		<SidebarMenuItem
			onClick={hasSwitch ? undefined : onClick}
			className={`flex items-center justify-between gap-2 bg-background p-2 rounded-md h-20 ${
				hasSwitch
					? ""
					: "hover:bg-accent hover:text-accent-foreground cursor-pointer"
			}`}
		>
			<div className="flex items-center gap-2">
				<Icon className="size-8" />
				<span className="body2 font-bold">{t(titleKey)}</span>
			</div>
			{hasSwitch && (
				<Switch checked={switchChecked} onCheckedChange={onSwitchChange} />
			)}
		</SidebarMenuItem>
	);
}
