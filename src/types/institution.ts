export interface Institution {
	id: number;
	name: string;
	street: string;
	street_number: string;
	zip_code: string;
	city?: { name: string };
	district?: { name: string };
	neighbourhood?: { name: string };
	case?: string;
	st_asgeojson?: string;
}

export interface GeoFeature {
	id: string;
	place_name: string;
	center: [number, number];
	geometry: {
		coordinates: [number, number];
	};
	text?: string;
	bbox?: [number, number, number, number];
}

export type SearchResult = Institution | GeoFeature;
