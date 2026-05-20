"use client";

import SimpleLanguage from "@/icons/simple-language.svg";
import SignLanguage from "@/icons/sign-language.svg";
import List from "@/icons/list.svg";
import MapIcon from "@/icons/map.svg";
import FontSize from "@/icons/font-size.svg";
import Contrast from "@/icons/contrast.svg";
import Settings from "@/icons/settings.svg";
import { useAppStore } from "@/lib/store/appStore";
import { getModalLink } from "@/lib/utils/modalRouting";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useRouter } from "next/navigation";
import { SubMenuOption } from "../SubMenuOption";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

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
		id: "mapView",
		icon: MapIcon,
		titleKey: "map.title",
		hasSwitch: false,
	},
	{
		id: "listView",
		icon: List,
		titleKey: "listView.title",
		hasSwitch: false,
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
	{
		id: "reducedMotion",
		icon: Settings,
		titleKey: "accessibility.motion.title",
		hasSwitch: true,
	},
] as const;

export function AccessibilityContent() {
	const {
		isContrastMode,
		setIsContrastMode,
		setBaseFontSize,
		isLargeTextMode,
		setIsLargeTextMode,
		isReducedMotion,
		setIsReducedMotion,
	} = useAppStore();
	const router = useRouter();
	const toLocalePath = useLocalePath();

	const openModalRoute = (id: string) => {
		const { url, target } = getModalLink(id, toLocalePath);
		if (target === "_blank") {
			if (typeof window !== "undefined") {
				window.open(url, "_blank", "noopener,noreferrer");
			}
			return;
		}
		router.push(url);
	};

	const handleSwitchChange = (optionId: string, checked: boolean) => {
		switch (optionId) {
			case "fontSize":
				setIsLargeTextMode(checked);
				setBaseFontSize(checked ? 18 : 16);
				break;
			case "contrast":
				setIsContrastMode(checked);
				break;
			case "reducedMotion":
				setIsReducedMotion(checked);
				break;
			default:
				reportClientTelemetry({
					level: "warn",
					event: "accessibility.option.unknown",
					metadata: {
						option_id: optionId,
					},
				});
				break;
		}
	};

	const getSwitchState = (optionId: string) => {
		switch (optionId) {
			case "fontSize":
				return isLargeTextMode;
			case "contrast":
				return isContrastMode;
			case "reducedMotion":
				return isReducedMotion;
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
									if (option.id === "mapView") {
										router.push(toLocalePath("/map"));
									} else if (option.id === "listView") {
										router.push(toLocalePath("/list"));
									} else if (option.id === "simpleLanguage") {
										openModalRoute("simpleLanguage");
									} else if (option.id === "signLanguage") {
										openModalRoute("signLanguage");
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
