import { create } from "zustand";

export interface ModalStoreState {
	downloadModalMode: "all" | "filtered" | "selected";
	setDownloadModalMode: (mode: "all" | "filtered" | "selected") => void;
	modalHistory: string[];
	setModalHistory: (history: string[]) => void;
	backOnModal: () => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
	// Initial states
	downloadModalMode: "all",
	modalHistory: [],
	// Setters
	setDownloadModalMode: (mode) => set({ downloadModalMode: mode }),
	setModalHistory: (history) => set({ modalHistory: history }),
	backOnModal: () => {
		if (typeof window !== "undefined") {
			window.history.back();
		}
	},
}));
