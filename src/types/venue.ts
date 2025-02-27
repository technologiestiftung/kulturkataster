export interface VenueProperties {
	id: number;
	venue_name: string;
	street: string;
	street_number: string;
	zip_code: string;
	city: string;
	district: string;
	neighbourhood: string;
	address_suffix: string;
	venue_type: string[];
	size: number;
	owner_name: string;
	owner_type: string;
	rental_contract_type: string;
	rental_contract_end: string | null;
	protection_status: string;
	established_since: string;
	opening_status: string[];
	label_id: number[];
	contact_person_name: string;
	contact_person_surname: string;
	contact_person_email: string;
	contact_person_phone: string;
	date_added: string;
	last_updated: string;
	user_id: number;
	status: string;
	source: string;
	cultural_area: string;
	closing_reason: string | null;
}

export interface VenueFeature extends VenueProperties {
	type: "Feature";
	geometry: {
		type: "Point";
		coordinates: [number, number];
	};
}
