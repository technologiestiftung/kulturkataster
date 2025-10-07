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
			setIsLargeTextMode: (isLargeText) =>
				set({ isLargeTextMode: isLargeText }),
			baseFontSize: 16,
			setBaseFontSize: createSetBaseFontSize(set),
			viewMode: "map",
			setViewMode: (mode) => set({ viewMode: mode }),
		}),
		{
			name: "app-storage",
		},
	),
);
