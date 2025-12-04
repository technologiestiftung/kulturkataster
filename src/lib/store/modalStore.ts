/* eslint-disable complexity */
import { create } from "zustand";

function popAndGetLastImmutable<T>(arr: T[]): {
	newHistory: T[];
	last: T | undefined;
} {
	const newHistory = arr.slice(0, -1);
	const last = newHistory[newHistory.length - 1];
	return { newHistory, last };
}

export interface ModalStoreState {
	welcomeModalOpen: boolean;
	aboutModalOpen: boolean;
	privacyModalOpen: boolean;
	imprintModalOpen: boolean;
	accessibilityModalOpen: boolean;
	accessibilitySettingsModalOpen: boolean;
	informationModalOpen: boolean;
	simpleLanguageInformationModalOpen: boolean;
	downloadModalOpen: boolean;
	downloadModalMode: "all" | "filtered" | "selected";
	mobileMenuModalOpen: boolean;
	signLanguageModalOpen: boolean;

	modalHistory: string[];

	setAboutModalOpen: (open: boolean) => void;
	setPrivacyModalOpen: (open: boolean) => void;
	setImprintModalOpen: (open: boolean) => void;
	setAccessibilityModalOpen: (open: boolean) => void;
	setAccessibilitySettingsModalOpen: (open: boolean) => void;
	setInformationModalOpen: (open: boolean) => void;
	setSimpleLanguageInformationModalOpen: (open: boolean) => void;
	setDownloadModalOpen: (open: boolean) => void;
	setDownloadModalMode: (mode: "all" | "filtered" | "selected") => void;
	setMobileMenuModalOpen: (open: boolean) => void;
	setSignLanguageModalOpen: (open: boolean) => void;

	openModal: (modalName: string, fromWelcomeModal?: boolean) => void;
	backOnModal: () => void;
	closeAllModals: () => void;
	clearModalHistory: () => void;

	handleFooterItemClick: (id: string) => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
	// Initial states
	welcomeModalOpen: false,
	aboutModalOpen: false,
	privacyModalOpen: false,
	imprintModalOpen: false,
	accessibilityModalOpen: false,
	accessibilitySettingsModalOpen: false,
	informationModalOpen: false,
	simpleLanguageInformationModalOpen: false,
	downloadModalOpen: false,
	downloadModalMode: "all",
	mobileMenuModalOpen: false,
	signLanguageModalOpen: false,

	modalHistory: [],

	// Setters
	setAboutModalOpen: (open) => set({ aboutModalOpen: open }),
	setPrivacyModalOpen: (open) => set({ privacyModalOpen: open }),
	setImprintModalOpen: (open) => set({ imprintModalOpen: open }),
	setAccessibilityModalOpen: (open) => set({ accessibilityModalOpen: open }),
	setAccessibilitySettingsModalOpen: (open) =>
		set({ accessibilitySettingsModalOpen: open }),
	setInformationModalOpen: (open) => set({ informationModalOpen: open }),
	setSimpleLanguageInformationModalOpen: (open) =>
		set({ simpleLanguageInformationModalOpen: open }),
	setDownloadModalOpen: (open) => set({ downloadModalOpen: open }),
	setDownloadModalMode: (mode) => set({ downloadModalMode: mode }),
	setMobileMenuModalOpen: (open) => set({ mobileMenuModalOpen: open }),
	setSignLanguageModalOpen: (open) => set({ signLanguageModalOpen: open }),

	openModal: (modalName: string, fromWelcomeModal?: boolean) => {
		set((state) => {
			let setModalHistory;
			if (fromWelcomeModal && !state.modalHistory.length) {
				setModalHistory = ["welcome", modalName];
			}

			const newState = {
				welcomeModalOpen: false,
				aboutModalOpen: false,
				privacyModalOpen: false,
				imprintModalOpen: false,
				accessibilityModalOpen: false,
				accessibilitySettingsModalOpen: false,
				informationModalOpen: false,
				downloadModalOpen: false,
				simpleLanguageInformationModalOpen: false,
				signLanguageModalOpen: false,
				modalHistory: setModalHistory || [...state.modalHistory, modalName],
			};

			switch (modalName) {
				case "welcome":
					newState.welcomeModalOpen = true;
					break;
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
				case "accessibilitySettings":
					newState.accessibilitySettingsModalOpen = true;
					break;
				case "signLanguageInformation":
				case "signLanguageInformationShort":
				case "signLanguageInformationLong":
					newState.signLanguageModalOpen = true;
					break;
				case "simpleLanguageInformation":
					newState.simpleLanguageInformationModalOpen = true;
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

	backOnModal: () => {
		set((state) => {
			const { last, newHistory } = popAndGetLastImmutable(state.modalHistory);

			const newState = {
				welcomeModalOpen: false,
				aboutModalOpen: false,
				privacyModalOpen: false,
				imprintModalOpen: false,
				accessibilityModalOpen: false,
				accessibilitySettingsModalOpen: false,
				informationModalOpen: false,
				downloadModalOpen: false,
				simpleLanguageInformationModalOpen: false,
				signLanguageModalOpen: false,
				modalHistory: newHistory,
			};

			switch (last) {
				case "welcome":
					newState.welcomeModalOpen = true;
					break;
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
				case "accessibilitySettings":
					newState.accessibilitySettingsModalOpen = true;
					break;
				case "signLanguageInformation":
				case "signLanguageInformationShort":
				case "signLanguageInformationLong":
					newState.signLanguageModalOpen = true;
					break;
				case "simpleLanguageInformation":
					newState.simpleLanguageInformationModalOpen = true;
					break;
				case "information":
				case "info":
					newState.informationModalOpen = true;
					break;
				case "download":
					newState.downloadModalOpen = true;
					break;
				default:
					console.warn(`Unknown modal name: ${last}`);
					return state;
			}
			return newState;
		});
	},

	closeAllModals: () =>
		set({
			welcomeModalOpen: false,
			aboutModalOpen: false,
			privacyModalOpen: false,
			imprintModalOpen: false,
			accessibilityModalOpen: false,
			accessibilitySettingsModalOpen: false,
			informationModalOpen: false,
			downloadModalOpen: false,
			mobileMenuModalOpen: false,
			simpleLanguageInformationModalOpen: false,
			signLanguageModalOpen: false,
			modalHistory: [],
		}),

	clearModalHistory: () =>
		set({
			modalHistory: [],
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
