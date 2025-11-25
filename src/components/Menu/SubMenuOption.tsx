"use client";

import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import type { KeyboardEvent } from "react";

interface SubMenuOptionProps {
	icon: React.ComponentType<{ className?: string }>;
	titleKey: string;
	onClick?: () => void;
	hasSwitch?: boolean;
	switchChecked?: boolean;
	onSwitchChange?: (checked: boolean) => void;
	switchKey?: string;
}

export function SubMenuOption({
	icon: Icon,
	titleKey,
	onClick,
	hasSwitch = false,
	switchChecked = false,
	onSwitchChange,
	switchKey,
}: SubMenuOptionProps) {
	const { t } = useTranslation("common");

	const handleClick = () => {
		if (hasSwitch && onSwitchChange) {
			onSwitchChange(!switchChecked);
		} else if (onClick) {
			onClick();
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
		if (hasSwitch) {
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick();
		}
	};

	const displayLabel =
		hasSwitch && switchKey && switchChecked ? t(switchKey) : t(titleKey);

	return (
		<SidebarMenuItem
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={hasSwitch ? undefined : 0}
			role={hasSwitch ? undefined : "button"}
			className="flex items-center justify-between gap-2 bg-background p-2 rounded-md h-20 hover:bg-background hover:shadow hover:text-accent-foreground cursor-pointer"
		>
			<div className="flex items-center gap-2">
				<Icon className="size-8" />
				<span className="body2 font-bold">{displayLabel}</span>
			</div>
			{hasSwitch && (
				<Switch
					checked={switchChecked}
					onCheckedChange={onSwitchChange}
					onClick={(e) => e.stopPropagation()}
					aria-label={t(titleKey)}
				/>
			)}
		</SidebarMenuItem>
	);
}
