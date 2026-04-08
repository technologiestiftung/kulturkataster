import { AppStoreState } from "@/types/app";
import { applyReducedMotionPreference } from "@/lib/utils/motion";

export const createSetBaseFontSize =
	(set: (fn: (state: AppStoreState) => Partial<AppStoreState>) => void) =>
	(size: number) => {
		const percentage = (size / 16) * 100;
		document.documentElement.style.fontSize = `${percentage}%`;
		set(() => ({ baseFontSize: size }));
	};

export const createSetContrastMode =
	(set: (fn: (state: AppStoreState) => Partial<AppStoreState>) => void) =>
	(enabled: boolean) => {
		if (enabled) {
			document.documentElement.setAttribute("data-theme", "contrast");
		} else {
			document.documentElement.removeAttribute("data-theme");
		}
		set(() => ({ isContrastMode: enabled }));
	};

export const createSetReducedMotion =
	(set: (fn: (state: AppStoreState) => Partial<AppStoreState>) => void) =>
	(enabled: boolean) => {
		applyReducedMotionPreference(enabled);
		set(() => ({ isReducedMotion: enabled }));
	};
