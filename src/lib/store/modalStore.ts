import { create } from "zustand";

export interface ModalStoreState {
	// Modal states
	aboutModalOpen: boolean;
	privacyModalOpen: boolean;
	imprintModalOpen: boolean;
	accessibilityModalOpen: boolean;
	informationModalOpen: boolean;

	// Modal actions
	setAboutModalOpen: (open: boolean) => void;
	setPrivacyModalOpen: (open: boolean) => void;
	setImprintModalOpen: (open: boolean) => void;
	setAccessibilityModalOpen: (open: boolean) => void;
	setInformationModalOpen: (open: boolean) => void;

	// methods to open any modal by name
	openModal: (modalName: string) => void;
	closeAllModals: () => void;

	// Helper method for handling footer item clicks
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

	// Convenience methods
	openModal: (modalName: string) => {
		set((state) => {
			// Close all modals first
			const newState = {
				aboutModalOpen: false,
				privacyModalOpen: false,
				imprintModalOpen: false,
				accessibilityModalOpen: false,
				informationModalOpen: false,
			};

			// Open the requested modal
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

	// Helper method for handling footer item clicks (consolidates the logic from Footer and ModalFooter)
	handleFooterItemClick: (id: string) => {
		switch (id) {
			case "about":
				set({ aboutModalOpen: true });
				break;
			case "imprint":
				set({ imprintModalOpen: true });
				break;
			case "privacy":
				set({ privacyModalOpen: true });
				break;
			case "accessibility":
				set({ accessibilityModalOpen: true });
				break;
			case "info":
			case "information":
				set({ informationModalOpen: true });
				break;
			default:
				console.warn(`Unknown footer item: ${id}`);
		}
	},
}));
