import { AppStoreState } from "@/types/app";

export const createSetBaseFontSize =
	(set: (fn: (state: AppStoreState) => Partial<AppStoreState>) => void) =>
	(size: number) => {
		document.documentElement.style.fontSize = `${size}px`;
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
