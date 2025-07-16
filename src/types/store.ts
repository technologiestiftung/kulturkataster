import { VenueProperties } from "./venue";

export type VenueState = {
	selectedVenueId: string;
	setSelectedVenueId: (id: string) => void;
	selectedVenueProperties: VenueProperties | null;
	setSelectedVenueProperties: (properties: VenueProperties | null) => void;
};
