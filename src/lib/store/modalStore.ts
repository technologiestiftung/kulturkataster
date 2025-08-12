import { create } from "zustand";

export interface ModalStoreState {
	aboutModalOpen: boolean;
	privacyModalOpen: boolean;
	imprintModalOpen: boolean;
	accessibilityModalOpen: boolean;
	informationModalOpen: boolean;

	setAboutModalOpen: (open: boolean) => void;
	setPrivacyModalOpen: (open: boolean) => void;
	setImprintModalOpen: (open: boolean) => void;
	setAccessibilityModalOpen: (open: boolean) => void;
	setInformationModalOpen: (open: boolean) => void;

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

	// Setters
	setAboutModalOpen: (open) => set({ aboutModalOpen: open }),
	setPrivacyModalOpen: (open) => set({ privacyModalOpen: open }),
	setImprintModalOpen: (open) => set({ imprintModalOpen: open }),
	setAccessibilityModalOpen: (open) => set({ accessibilityModalOpen: open }),
	setInformationModalOpen: (open) => set({ informationModalOpen: open }),

	openModal: (modalName: string) => {
		set((state) => {
			const newState = {
				aboutModalOpen: false,
				privacyModalOpen: false,
				imprintModalOpen: false,
				accessibilityModalOpen: false,
				informationModalOpen: false,
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
		}),

	handleFooterItemClick: (id: string) => {
		const { openModal } = useModalStore.getState();
		openModal(id);
	},
}));
