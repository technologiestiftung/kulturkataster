export interface AppStoreState {
	firstTimeUser: boolean;
	setFirstTimeUser: (firstTime: boolean) => void;
	isContrastMode: boolean;
	setIsContrastMode: (isContrast: boolean) => void;
	isLargeTextMode: boolean;
	setIsLargeTextMode: (isLargeText: boolean) => void;
	baseFontSize: number;
	setBaseFontSize: (size: number) => void;
	activePanel: "filter" | "search" | null;
	setActivePanel: (panel: "filter" | "search" | null) => void;
	isLayerTreeOpen: boolean;
	setIsLayerTreeOpen: (isOpen: boolean) => void;
}
