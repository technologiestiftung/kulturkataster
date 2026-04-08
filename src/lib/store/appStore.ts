import { AppStoreState } from "@/types/app";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	createSetBaseFontSize,
	createSetContrastMode,
	createSetReducedMotion,
} from "./appActions";

export const useAppStore = create<AppStoreState>()(
	persist(
		(set) => ({
			firstTimeUser: true,
			setFirstTimeUser: (firstTime) => set({ firstTimeUser: firstTime }),
			viewMode: "map",
			setViewMode: (mode) => set({ viewMode: mode }),
			isContrastMode: false,
			setIsContrastMode: createSetContrastMode(set),
			isLargeTextMode: false,
			setIsLargeTextMode: (isLargeText) => {
				if (isLargeText) {
					document.documentElement.style.fontSize = "112.5%";
				} else {
					document.documentElement.style.fontSize = "";
				}
				set({ isLargeTextMode: isLargeText });
			},
			isReducedMotion: false,
			setIsReducedMotion: createSetReducedMotion(set),
			baseFontSize: 16,
			setBaseFontSize: createSetBaseFontSize(set),
			isLayerTreeOpen: false,
			setIsLayerTreeOpen: (isOpen) => set({ isLayerTreeOpen: isOpen }),
		}),
		{
			name: "app-storage",
			partialize: (state) => ({
				firstTimeUser: state.firstTimeUser,
				viewMode: state.viewMode,
				isContrastMode: state.isContrastMode,
				isLargeTextMode: state.isLargeTextMode,
				isReducedMotion: state.isReducedMotion,
				baseFontSize: state.baseFontSize,
			}),
		},
	),
);
