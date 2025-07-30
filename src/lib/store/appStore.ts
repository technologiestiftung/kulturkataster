import { AppStoreState } from "@/types/app";
import { create } from "zustand";
import { createSetBaseFontSize, createSetContrastMode } from "./appActions";

export const useAppStore = create<AppStoreState>((set) => ({
	firstTimeUser: true,
	setFirstTimeUser: (firstTime) => set({ firstTimeUser: firstTime }),
	isContrastMode: false,
	setIsContrastMode: createSetContrastMode(set),
	isLargeTextMode: false,
	setIsLargeTextMode: (isLargeText) => set({ isLargeTextMode: isLargeText }),
	baseFontSize: 16,
	setBaseFontSize: createSetBaseFontSize(set),
}));
