"use client";

import SimpleLanguage from "@/icons/simple-language.svg";
import SignLanguage from "@/icons/sign-language.svg";
import FontSize from "@/icons/font-size.svg";
import List from "@/icons/list.svg";
import Contrast from "@/icons/contrast.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useModalStore } from "@/lib/store/modalStore";
import { SubMenuOption } from "../SubMenuOption";

interface AccessibilityContentProps {
	onItemClick?: (itemName: string) => void; // Made optional since we can use the modal store directly
	openLinksInModal?: boolean;
}

const accessibilityOptions = [
	{
		id: "simpleLanguage",
		icon: SimpleLanguage,
		titleKey: "accessibility.simpleLanguage.title",
		hasSwitch: false,
	},
	{
		id: "signLanguage",
		icon: SignLanguage,
		titleKey: "accessibility.signLanguage.title",
		hasSwitch: false,
	},
	{
		id: "viewMode",
		icon: List, // Reusing contrast icon for now
		titleKey: "accessibility.viewMode.title",
		hasSwitch: true,
	},
	{
		id: "fontSize",
		icon: FontSize,
		titleKey: "accessibility.fontSize.title",
		hasSwitch: true,
	},
	{
		id: "contrast",
		icon: Contrast,
		titleKey: "accessibility.contrast.darkMode",
		switchKey: "accessibility.contrast.lightMode",
		hasSwitch: true,
	},
] as const;

export function AccessibilityContent({
	onItemClick,
	openLinksInModal,
}: AccessibilityContentProps) {
	const {
		isContrastMode,
		setIsContrastMode,
		setBaseFontSize,
		isLargeTextMode,
		setIsLargeTextMode,
		viewMode,
		setViewMode,
	} = useAppStore();

	const {
		openModal,
		setAccessibilityModalOpen,
		setSimpleLanguageInformationModalOpen,
		setSignLanguageModalOpen,
	} = useModalStore();

	const handleSwitchChange = (optionId: string, checked: boolean) => {
		switch (optionId) {
			case "viewMode":
				setViewMode(checked ? "list" : "map");
				break;
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
			case "viewMode":
				return viewMode === "list";
			default:
				return false;
		}
	};

	return (
		<div className="space-y-4 flex flex-col min-h-full w-full">
			{accessibilityOptions.map((option) => (
				<SubMenuOption
					key={option.id}
					icon={option.icon}
					titleKey={option.titleKey}
					switchKey={"switchKey" in option ? option.switchKey : undefined}
					onClick={
						option.hasSwitch
							? undefined
							: () => {
									if (option.id === "simpleLanguage") {
										if (openLinksInModal) {
											openModal("simpleLanguageInformation");
										} else {
											setSimpleLanguageInformationModalOpen(true);
										}
									} else if (option.id === "signLanguage") {
										if (openLinksInModal) {
											openModal("signLanguageInformation");
										} else {
											setSignLanguageModalOpen(true);
										}
									} else if (onItemClick) {
										onItemClick("accessibility");
									} else {
										setAccessibilityModalOpen(true);
									}
								}
					}
					hasSwitch={option.hasSwitch}
					switchChecked={getSwitchState(option.id)}
					onSwitchChange={(checked) => handleSwitchChange(option.id, checked)}
				/>
			))}
		</div>
	);
}
