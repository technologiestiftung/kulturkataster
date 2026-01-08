import { create } from "zustand";

export interface ModalStoreState {
	downloadModalMode: "all" | "filtered" | "selected";
	setDownloadModalMode: (mode: "all" | "filtered" | "selected") => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
	// Initial states
	downloadModalMode: "all",
	// Setters
	setDownloadModalMode: (mode) => set({ downloadModalMode: mode }),
}));
