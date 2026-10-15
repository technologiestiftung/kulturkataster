"use client";

import { Switch } from "@/components/ui/switch";
import { useId } from "react";
import { useTranslation } from "react-i18next";

interface SubMenuOptionProps {
	icon: React.ComponentType<{ className?: string }>;
	titleKey: string;
	onClick?: () => void;
	hasSwitch?: boolean;
	switchChecked?: boolean;
	onSwitchChange?: (checked: boolean) => void;
	switchKey?: string;
}

const rowClassName =
	"flex w-full items-center justify-between gap-2 bg-background p-2 rounded-md h-20 text-left hover:bg-background hover:shadow hover:text-accent-foreground cursor-pointer tab-ring";

export function SubMenuOption({
	icon: Icon,
	titleKey,
	onClick,
	hasSwitch = false,
	switchChecked = false,
	onSwitchChange,
	switchKey,
}: SubMenuOptionProps) {
	const { t } = useTranslation();
	const switchId = useId();

	const displayLabel =
		hasSwitch && switchKey && switchChecked
			? t("common." + switchKey)
			: t("common." + titleKey);

	const content = (
		<span className="flex items-center gap-2">
			<Icon className="size-8" />
			<span className="body2 font-bold">{displayLabel}</span>
		</span>
	);

	if (!hasSwitch) {
		return (
			<button type="button" onClick={onClick} className={rowClassName}>
				{content}
			</button>
		);
	}

	// The whole row is the switch's <label>, so clicking anywhere toggles it
	// without nesting the switch inside another interactive element.
	return (
		<label htmlFor={switchId} className={rowClassName}>
			{content}
			<span className="flex items-center gap-1">
				<Switch
					id={switchId}
					checked={switchChecked}
					onCheckedChange={onSwitchChange}
					aria-label={t("common." + titleKey)}
				/>
				<span className="body2 font-bold min-w-[2rem]" aria-hidden="true">
					{switchChecked
						? t("common.accessibility.switchOn")
						: t("common.accessibility.switchOff")}
				</span>
			</span>
		</label>
	);
}
