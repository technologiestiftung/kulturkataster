import { create } from "zustand";

export interface ModalStoreState {
	aboutModalOpen: boolean;
	privacyModalOpen: boolean;
	imprintModalOpen: boolean;
	accessibilityModalOpen: boolean;
	informationModalOpen: boolean;
	downloadModalOpen: boolean;
	downloadModalMode: "all" | "filtered" | "selected";

	setAboutModalOpen: (open: boolean) => void;
	setPrivacyModalOpen: (open: boolean) => void;
	setImprintModalOpen: (open: boolean) => void;
	setAccessibilityModalOpen: (open: boolean) => void;
	setInformationModalOpen: (open: boolean) => void;
	setDownloadModalOpen: (open: boolean) => void;
	setDownloadModalMode: (mode: "all" | "filtered" | "selected") => void;

	openModal: (modalName: string) => void;
	closeAllModals: () => void;

	handleFooterItemClick: (id: string) => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
	// Initial states
	aboutModalOpen: false,
	privacyModalOpen: false,
	imprintModalOpen: false,
	accessibilityModalOpen: false,
	informationModalOpen: false,
	downloadModalOpen: false,
	downloadModalMode: "all",

	// Setters
	setAboutModalOpen: (open) => set({ aboutModalOpen: open }),
	setPrivacyModalOpen: (open) => set({ privacyModalOpen: open }),
	setImprintModalOpen: (open) => set({ imprintModalOpen: open }),
	setAccessibilityModalOpen: (open) => set({ accessibilityModalOpen: open }),
	setInformationModalOpen: (open) => set({ informationModalOpen: open }),
	setDownloadModalOpen: (open) => set({ downloadModalOpen: open }),
	setDownloadModalMode: (mode) => set({ downloadModalMode: mode }),

	openModal: (modalName: string) => {
		set((state) => {
			const newState = {
				aboutModalOpen: false,
				privacyModalOpen: false,
				imprintModalOpen: false,
				accessibilityModalOpen: false,
				informationModalOpen: false,
				downloadModalOpen: false,
			};

			switch (modalName) {
				case "about":
					newState.aboutModalOpen = true;
					break;
				case "privacy":
					newState.privacyModalOpen = true;
					break;
				case "imprint":
					newState.imprintModalOpen = true;
					break;
				case "accessibility":
					newState.accessibilityModalOpen = true;
					break;
				case "information":
				case "info":
					newState.informationModalOpen = true;
					break;
				case "download":
					newState.downloadModalOpen = true;
					break;
				default:
					console.warn(`Unknown modal name: ${modalName}`);
					return state;
			}
			return newState;
		});
	},

	closeAllModals: () =>
		set({
			aboutModalOpen: false,
			privacyModalOpen: false,
			imprintModalOpen: false,
			accessibilityModalOpen: false,
			informationModalOpen: false,
			downloadModalOpen: false,
		}),

	handleFooterItemClick: (id: string) => {
		if (id === "privacy") {
			window.open(
				"https://dsgvo-info.cortina-consult.de/kulturkataster/",
				"_blank",
			);
		} else {
			const { openModal } = useModalStore.getState();
			openModal(id);
		}
	},
}));
