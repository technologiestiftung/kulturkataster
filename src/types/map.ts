/* eslint-disable @typescript-eslint/no-explicit-any */
import Map from "ol/Map";

export type LayerType = "WMS" | "WFS" | "WMTS";
export type LayerStatus = "initial" | "loading" | "loaded";

export interface MapViewOptions {
	resolution: number;
	scale: number;
	zoomLevel: number;
}

export interface MapViewConfig {
	backgroundImage: string;
	startCenter: number[];
	extent: number[];
	epsg: string;
	startZoomLevel: number;
	options: MapViewOptions[];
}

export interface PortalMapConfig {
	controls: {
		zoom: boolean;
		orientation: {
			zoomMode: string;
		};
	};
	mapView: MapViewConfig;
}

export interface LayerElement {
	id: string;
	visibility: boolean;
	type?: "WMS" | "WFS" | "WMTS";
	url?: string;
	status?: LayerStatus;
	service?: Service;
}

export interface Dataset {
	md_id: string;
	rs_id: string;
	csw_url: string;
	show_doc_url: string;
}

export interface Service {
	id: string;
	name: string;
	name_lang: string;
	capabilitiesUrl: string;
	url: string;
	typ: LayerType;
	tileMatrixSet?: string;
	layers: string;
	optionsFromCapabilities: boolean;
	crs: string;
	legend: string[];
	layerAttribution: string;
	datasets: Dataset[];
}

export interface LayerConfig {
	baselayer: {
		elements: LayerElement[];
	};
	subjectlayer: {
		elements: LayerElement[];
	};
}
export interface PortalConfig {
	map: PortalMapConfig;
	portalFooter: { urls: string[] };
	tree: {
		addLayerButton: {
			active: boolean;
			searchBar: {
				active: boolean;
				searchInterfaceInstanceId: string;
				searchCategory: string;
			};
		};
		highlightedFeatures: { active: boolean };
	};
	mainMenu: {
		expanded: boolean;
		title: {
			text: string;
			logo: string;
			link: string;
			toolTip: string;
		};
		searchBar: {
			searchInterfaces: any[];
		};
		sections: any[];
	};
	secondaryMenu: {
		expanded: boolean;
		sections: any[];
	};
}

export interface MapConfig {
	portalConfig: PortalConfig;
	layerConfig: LayerConfig;
}

export interface MapStoreState {
	map: Map | null;
	config: MapConfig | null;
	setConfig: (config: MapConfig) => void;
	populateMap: (map: Map) => void;
	removeMap: () => void;
	setMapStatus: (id: string, status: LayerStatus) => void;
	getMapStatus: (id: string) => LayerStatus | undefined;
}
