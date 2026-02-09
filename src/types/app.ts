export interface AppStoreState {
	firstTimeUser: boolean;
	setFirstTimeUser: (firstTime: boolean) => void;
	viewMode: "map" | "list";
	setViewMode: (mode: "map" | "list") => void;
	isContrastMode: boolean;
	setIsContrastMode: (isContrast: boolean) => void;
	isLargeTextMode: boolean;
	setIsLargeTextMode: (isLargeText: boolean) => void;
	baseFontSize: number;
	setBaseFontSize: (size: number) => void;
	isLayerTreeOpen: boolean;
	setIsLayerTreeOpen: (isOpen: boolean) => void;
}
