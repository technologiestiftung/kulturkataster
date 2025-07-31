"use client";

import * as React from "react";
import SignLanguage from "@/icons/sign-language.svg";
import SimpleLanguage from "@/icons/simple-language.svg";
import FontSize from "@/icons/font-size.svg";
import Contrast from "@/icons/contrast.svg";
import { SubMenuOption } from "../SubMenuOption";
import { useAppStore } from "@/lib/store/appStore";

interface AccessibilityContentProps {
	onItemClick: (itemName: string) => void;
}

const accessibilityOptions = [
	{
		id: "signLanguage",
		icon: SignLanguage,
		titleKey: "accessibility.signLanguage.title",
		hasSwitch: false,
	},
	{
		id: "simpleLanguage",
		icon: SimpleLanguage,
		titleKey: "accessibility.simpleLanguage.title",
		hasSwitch: false,
	},
	{
		id: "fontSize",
		icon: FontSize,
		titleKey: "accessibility.fontSize.title",
		hasSwitch: true,
	},
	// {
	// 	id: "contrast",
	// 	icon: Contrast,
	// 	titleKey: "accessibility.contrast.title",
	// 	hasSwitch: true,
	// },
] as const;

export function AccessibilityContent({
	onItemClick,
}: AccessibilityContentProps) {
	const {
		isContrastMode,
		setIsContrastMode,
		setBaseFontSize,
		isLargeTextMode,
		setIsLargeTextMode,
	} = useAppStore();

	const handleSwitchChange = (optionId: string, checked: boolean) => {
		switch (optionId) {
			case "fontSize":
				setIsLargeTextMode(checked);
				setBaseFontSize(checked ? 18 : 16);
				break;
			case "contrast":
				setIsContrastMode(checked);
				break;
			default:
				console.warn(`Unknown option ID: ${optionId}`);
				break;
		}
	};

	const getSwitchState = (optionId: string) => {
		switch (optionId) {
			case "fontSize":
				return isLargeTextMode;
			case "contrast":
				return isContrastMode;
			default:
				return false;
		}
	};

	return (
		<div className="space-y-4 flex flex-col p-2">
			{accessibilityOptions.map((option) => (
				<SubMenuOption
					key={option.id}
					icon={option.icon}
					titleKey={option.titleKey}
					onClick={
						option.hasSwitch ? undefined : () => onItemClick("accessibility")
					}
					hasSwitch={option.hasSwitch}
					switchChecked={getSwitchState(option.id)}
					onSwitchChange={(checked) => handleSwitchChange(option.id, checked)}
				/>
			))}
		</div>
	);
}
