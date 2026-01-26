import { AppStoreState } from "@/types/app";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSetBaseFontSize, createSetContrastMode } from "./appActions";

export const useAppStore = create<AppStoreState>()(
	persist(
		(set) => ({
			firstTimeUser: true,
			setFirstTimeUser: (firstTime) => set({ firstTimeUser: firstTime }),
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
			baseFontSize: 16,
			setBaseFontSize: createSetBaseFontSize(set),
			activePanel: null,
			setActivePanel: (panel) => set({ activePanel: panel }),
			isLayerTreeOpen: false,
			setIsLayerTreeOpen: (isOpen) => set({ isLayerTreeOpen: isOpen }),
		}),
		{
			name: "app-storage",
			partialize: (state) => ({
				firstTimeUser: state.firstTimeUser,
				isContrastMode: state.isContrastMode,
				isLargeTextMode: state.isLargeTextMode,
				baseFontSize: state.baseFontSize,
			}),
		},
	),
);
