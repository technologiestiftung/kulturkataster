export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			category: {
				Row: {
					created_at: string;
					id: number;
					key: Database["public"]["Enums"]["category_key_enum"];
				};
				Insert: {
					created_at?: string;
					id?: number;
					key: Database["public"]["Enums"]["category_key_enum"];
				};
				Update: {
					created_at?: string;
					id?: number;
					key?: Database["public"]["Enums"]["category_key_enum"];
				};
				Relationships: [];
			};
			city: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			contact_person: {
				Row: {
					created_at: string;
					email: string | null;
					id: number;
					name: string;
					phone: string | null;
					surname: string | null;
				};
				Insert: {
					created_at?: string;
					email?: string | null;
					id?: number;
					name: string;
					phone?: string | null;
					surname?: string | null;
				};
				Update: {
					created_at?: string;
					email?: string | null;
					id?: number;
					name?: string;
					phone?: string | null;
					surname?: string | null;
				};
				Relationships: [];
			};
			cultural_area: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			district: {
				Row: {
					city_id: number | null;
					created_at: string;
					id: number;
					key: Database["public"]["Enums"]["berlin_district_enum"] | null;
					name: string;
				};
				Insert: {
					city_id?: number | null;
					created_at?: string;
					id?: number;
					key?: Database["public"]["Enums"]["berlin_district_enum"] | null;
					name: string;
				};
				Update: {
					city_id?: number | null;
					created_at?: string;
					id?: number;
					key?: Database["public"]["Enums"]["berlin_district_enum"] | null;
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: "district_city_id_fkey";
						columns: ["city_id"];
						isOneToOne: false;
						referencedRelation: "city";
						referencedColumns: ["id"];
					},
				];
			};
			funding_source: {
				Row: {
					created_at: string;
					id: number;
					key: Database["public"]["Enums"]["funding_source_key_enum"];
				};
				Insert: {
					created_at?: string;
					id?: number;
					key: Database["public"]["Enums"]["funding_source_key_enum"];
				};
				Update: {
					created_at?: string;
					id?: number;
					key?: Database["public"]["Enums"]["funding_source_key_enum"];
				};
				Relationships: [];
			};
			institution: {
				Row: {
					address_suffix: string | null;
					area: number | null;
					capacity: number | null;
					city_id: number | null;
					closing_reason: string | null;
					contact_person_id: number | null;
					created_at: string;
					created_by: string | null;
					cultural_area_id: number | null;
					district_id: number | null;
					email: string | null;
					established_since: string | null;
					established_until: string | null;
					funding_type: Database["public"]["Enums"]["funding_type_enum"] | null;
					geom: unknown;
					id: number;
					import_identifier: string | null;
					internal_notes: string | null;
					latlong: unknown;
					name: string;
					neighbourhood_id: number | null;
					notes: string | null;
					number_of_rooms: number | null;
					owner_id: number | null;
					phone: string | null;
					protection_status:
						| Database["public"]["Enums"]["protection_status_enum"]
						| null;
					rental_contract_end: string | null;
					rental_contract_type:
						| Database["public"]["Enums"]["rental_contract_type_enum"]
						| null;
					shared_use_allowed: boolean | null;
					shared_use_audience: string | null;
					shared_use_contact_person_id: number | null;
					shared_use_info: string | null;
					source_id: number | null;
					status: Database["public"]["Enums"]["institution_status_enum"] | null;
					street: string | null;
					street_number: string | null;
					updated_at: string;
					utilization_status:
						| Database["public"]["Enums"]["utilization_status_enum"]
						| null;
					website: string | null;
					zip_code: string | null;
				};
				Insert: {
					address_suffix?: string | null;
					area?: number | null;
					capacity?: number | null;
					city_id?: number | null;
					closing_reason?: string | null;
					contact_person_id?: number | null;
					created_at?: string;
					created_by?: string | null;
					cultural_area_id?: number | null;
					district_id?: number | null;
					email?: string | null;
					established_since?: string | null;
					established_until?: string | null;
					funding_type?:
						| Database["public"]["Enums"]["funding_type_enum"]
						| null;
					geom?: unknown;
					id?: number;
					import_identifier?: string | null;
					internal_notes?: string | null;
					latlong?: unknown;
					name: string;
					neighbourhood_id?: number | null;
					notes?: string | null;
					number_of_rooms?: number | null;
					owner_id?: number | null;
					phone?: string | null;
					protection_status?:
						| Database["public"]["Enums"]["protection_status_enum"]
						| null;
					rental_contract_end?: string | null;
					rental_contract_type?:
						| Database["public"]["Enums"]["rental_contract_type_enum"]
						| null;
					shared_use_allowed?: boolean | null;
					shared_use_audience?: string | null;
					shared_use_contact_person_id?: number | null;
					shared_use_info?: string | null;
					source_id?: number | null;
					status?:
						| Database["public"]["Enums"]["institution_status_enum"]
						| null;
					street?: string | null;
					street_number?: string | null;
					updated_at?: string;
					utilization_status?:
						| Database["public"]["Enums"]["utilization_status_enum"]
						| null;
					website?: string | null;
					zip_code?: string | null;
				};
				Update: {
					address_suffix?: string | null;
					area?: number | null;
					capacity?: number | null;
					city_id?: number | null;
					closing_reason?: string | null;
					contact_person_id?: number | null;
					created_at?: string;
					created_by?: string | null;
					cultural_area_id?: number | null;
					district_id?: number | null;
					email?: string | null;
					established_since?: string | null;
					established_until?: string | null;
					funding_type?:
						| Database["public"]["Enums"]["funding_type_enum"]
						| null;
					geom?: unknown;
					id?: number;
					import_identifier?: string | null;
					internal_notes?: string | null;
					latlong?: unknown;
					name?: string;
					neighbourhood_id?: number | null;
					notes?: string | null;
					number_of_rooms?: number | null;
					owner_id?: number | null;
					phone?: string | null;
					protection_status?:
						| Database["public"]["Enums"]["protection_status_enum"]
						| null;
					rental_contract_end?: string | null;
					rental_contract_type?:
						| Database["public"]["Enums"]["rental_contract_type_enum"]
						| null;
					shared_use_allowed?: boolean | null;
					shared_use_audience?: string | null;
					shared_use_contact_person_id?: number | null;
					shared_use_info?: string | null;
					source_id?: number | null;
					status?:
						| Database["public"]["Enums"]["institution_status_enum"]
						| null;
					street?: string | null;
					street_number?: string | null;
					updated_at?: string;
					utilization_status?:
						| Database["public"]["Enums"]["utilization_status_enum"]
						| null;
					website?: string | null;
					zip_code?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_city_id_fkey";
						columns: ["city_id"];
						isOneToOne: false;
						referencedRelation: "city";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_contact_person_id_fkey";
						columns: ["contact_person_id"];
						isOneToOne: false;
						referencedRelation: "contact_person";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_cultural_area_id_fkey";
						columns: ["cultural_area_id"];
						isOneToOne: false;
						referencedRelation: "cultural_area";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_district_id_fkey";
						columns: ["district_id"];
						isOneToOne: false;
						referencedRelation: "district";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_neighbourhood_id_fkey";
						columns: ["neighbourhood_id"];
						isOneToOne: false;
						referencedRelation: "neighbourhood";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_owner_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "owner";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_shared_use_contact_person_id_fkey";
						columns: ["shared_use_contact_person_id"];
						isOneToOne: false;
						referencedRelation: "contact_person";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_source_id_fkey";
						columns: ["source_id"];
						isOneToOne: false;
						referencedRelation: "source";
						referencedColumns: ["id"];
					},
				];
			};
			institution_category: {
				Row: {
					category_id: number | null;
					created_at: string;
					id: number;
					institution_id: number | null;
				};
				Insert: {
					category_id?: number | null;
					created_at?: string;
					id?: number;
					institution_id?: number | null;
				};
				Update: {
					category_id?: number | null;
					created_at?: string;
					id?: number;
					institution_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_category_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "category";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_category_institution_id_fkey";
						columns: ["institution_id"];
						isOneToOne: false;
						referencedRelation: "institution";
						referencedColumns: ["id"];
					},
				];
			};
			institution_field_permission: {
				Row: {
					action: Database["public"]["Enums"]["institution_action_enum"];
					created_at: string;
					field_name: string;
					id: number;
					institution_role_id: number | null;
				};
				Insert: {
					action: Database["public"]["Enums"]["institution_action_enum"];
					created_at?: string;
					field_name: string;
					id?: number;
					institution_role_id?: number | null;
				};
				Update: {
					action?: Database["public"]["Enums"]["institution_action_enum"];
					created_at?: string;
					field_name?: string;
					id?: number;
					institution_role_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_field_permission_institution_role_id_fkey";
						columns: ["institution_role_id"];
						isOneToOne: false;
						referencedRelation: "institution_role";
						referencedColumns: ["id"];
					},
				];
			};
			institution_funding_source: {
				Row: {
					created_at: string;
					funding_source_id: number | null;
					id: number;
					institution_id: number | null;
				};
				Insert: {
					created_at?: string;
					funding_source_id?: number | null;
					id?: number;
					institution_id?: number | null;
				};
				Update: {
					created_at?: string;
					funding_source_id?: number | null;
					id?: number;
					institution_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_funding_source_funding_source_id_fkey";
						columns: ["funding_source_id"];
						isOneToOne: false;
						referencedRelation: "funding_source";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_funding_source_institution_id_fkey";
						columns: ["institution_id"];
						isOneToOne: false;
						referencedRelation: "institution";
						referencedColumns: ["id"];
					},
				];
			};
			institution_parent_organization: {
				Row: {
					created_at: string;
					id: number;
					institution_id: number | null;
					parent_organization_id: number | null;
				};
				Insert: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					parent_organization_id?: number | null;
				};
				Update: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					parent_organization_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_parent_organization_institution_id_fkey";
						columns: ["institution_id"];
						isOneToOne: false;
						referencedRelation: "institution";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_parent_organization_parent_organization_id_fkey";
						columns: ["parent_organization_id"];
						isOneToOne: false;
						referencedRelation: "parent_organization";
						referencedColumns: ["id"];
					},
				];
			};
			institution_role: {
				Row: {
					created_at: string;
					description: string | null;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			institution_subcategory: {
				Row: {
					created_at: string;
					id: number;
					institution_id: number | null;
					subcategory_id: number | null;
				};
				Insert: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					subcategory_id?: number | null;
				};
				Update: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					subcategory_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_subcategory_institution_id_fkey";
						columns: ["institution_id"];
						isOneToOne: false;
						referencedRelation: "institution";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_subcategory_subcategory_id_fkey";
						columns: ["subcategory_id"];
						isOneToOne: false;
						referencedRelation: "subcategory";
						referencedColumns: ["id"];
					},
				];
			};
			institution_tag: {
				Row: {
					created_at: string;
					id: number;
					institution_id: number | null;
					tag_id: number | null;
				};
				Insert: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					tag_id?: number | null;
				};
				Update: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					tag_id?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "institution_tag_institution_id_fkey";
						columns: ["institution_id"];
						isOneToOne: false;
						referencedRelation: "institution";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "institution_tag_tag_id_fkey";
						columns: ["tag_id"];
						isOneToOne: false;
						referencedRelation: "tag";
						referencedColumns: ["id"];
					},
				];
			};
			neighbourhood: {
				Row: {
					created_at: string;
					district_id: number | null;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					district_id?: number | null;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					district_id?: number | null;
					id?: number;
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: "neighbourhood_district_id_fkey";
						columns: ["district_id"];
						isOneToOne: false;
						referencedRelation: "district";
						referencedColumns: ["id"];
					},
				];
			};
			owner: {
				Row: {
					created_at: string;
					id: number;
					name: string;
					owner_type: Database["public"]["Enums"]["owner_type_enum"] | null;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
					owner_type?: Database["public"]["Enums"]["owner_type_enum"] | null;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
					owner_type?: Database["public"]["Enums"]["owner_type_enum"] | null;
				};
				Relationships: [];
			};
			parent_organization: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			source: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			subcategory: {
				Row: {
					category_id: number;
					created_at: string;
					id: number;
					key: Database["public"]["Enums"]["subcategory_key_enum"];
				};
				Insert: {
					category_id: number;
					created_at?: string;
					id?: number;
					key: Database["public"]["Enums"]["subcategory_key_enum"];
				};
				Update: {
					category_id?: number;
					created_at?: string;
					id?: number;
					key?: Database["public"]["Enums"]["subcategory_key_enum"];
				};
				Relationships: [
					{
						foreignKeyName: "subcategory_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "category";
						referencedColumns: ["id"];
					},
				];
			};
			tag: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			user_institution: {
				Row: {
					created_at: string;
					id: number;
					institution_id: number | null;
					institution_role_id: number | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					institution_role_id?: number | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					id?: number;
					institution_id?: number | null;
					institution_role_id?: number | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "user_institution_institution_id_fkey";
						columns: ["institution_id"];
						isOneToOne: false;
						referencedRelation: "institution";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "user_institution_institution_role_id_fkey";
						columns: ["institution_role_id"];
						isOneToOne: false;
						referencedRelation: "institution_role";
						referencedColumns: ["id"];
					},
				];
			};
			user_profile: {
				Row: {
					categories: string[] | null;
					created_at: string;
					district: string | null;
					id: string;
					role: Database["public"]["Enums"]["user_role_enum"] | null;
					updated_at: string;
				};
				Insert: {
					categories?: string[] | null;
					created_at?: string;
					district?: string | null;
					id: string;
					role?: Database["public"]["Enums"]["user_role_enum"] | null;
					updated_at?: string;
				};
				Update: {
					categories?: string[] | null;
					created_at?: string;
					district?: string | null;
					id?: string;
					role?: Database["public"]["Enums"]["user_role_enum"] | null;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			build_field_arrays: {
				Args: { allowed_fields: string[] };
				Returns: {
					relationship_fields: string[];
					select_fields: string[];
				}[];
			};
			build_where_clause: {
				Args: { additional_conditions?: string; user_role: string };
				Returns: string;
			};
			get_institution_categories: {
				Args: { institution_id_param: number };
				Returns: Json;
			};
			get_institution_funding_sources: {
				Args: { institution_id_param: number };
				Returns: Json;
			};
			get_institution_parent_orgs: {
				Args: { institution_id_param: number };
				Returns: Json;
			};
			get_institution_subcategories: {
				Args: { institution_id_param: number };
				Returns: Json;
			};
			get_institution_tags: {
				Args: { institution_id_param: number };
				Returns: Json;
			};
			get_public_institution: {
				Args: { institution_id?: number };
				Returns: Json;
			};
			get_public_institutions: {
				Args: { limit_count?: number; search_term?: string };
				Returns: Json;
			};
			get_public_institutions_geojson: { Args: never; Returns: Json };
			get_public_institutions_with_filters: {
				Args: {
					category_keys?: Database["public"]["Enums"]["category_key_enum"][];
					district_keys?: Database["public"]["Enums"]["berlin_district_enum"][];
					include_closed?: boolean;
					subcategory_keys?: Database["public"]["Enums"]["subcategory_key_enum"][];
				};
				Returns: Json;
			};
			get_user_categories: {
				Args: never;
				Returns: Database["public"]["Enums"]["category_key_enum"][];
			};
			get_user_district: { Args: never; Returns: string };
			get_user_permissions: {
				Args: never;
				Returns: {
					allowed_fields: string[];
					user_role: string;
				}[];
			};
			get_user_role: { Args: never; Returns: string };
			user_has_any_institution_role: {
				Args: { institution_id_param: number; required_roles: string[] };
				Returns: boolean;
			};
		};
		Enums: {
			berlin_district_enum:
				| "charlottenburg_wilmersdorf"
				| "friedrichshain_kreuzberg"
				| "lichtenberg"
				| "marzahn_hellersdorf"
				| "mitte"
				| "neukoelln"
				| "pankow"
				| "reinickendorf"
				| "spandau"
				| "steglitz_zehlendorf"
				| "tempelhof_schoeneberg"
				| "treptow_koepenick";
			category_key_enum:
				| "studios"
				| "education_places"
				| "libraries"
				| "clubs_music_venues"
				| "galleries"
				| "cinemas"
				| "literature_places"
				| "museums"
				| "cultural_urban_development"
				| "potential_spaces"
				| "rehearsal_rooms"
				| "project_spaces_initiatives"
				| "sociocultural_centers"
				| "dance_venues"
				| "performing_arts_venues"
				| "graffiti_areas"
				| "other"
				| "urban_art";
			closing_reason_enum:
				| "lease_expired"
				| "funding_discontinued"
				| "ownership_change"
				| "other";
			funding_source_key_enum:
				| "private"
				| "district"
				| "state_berlin"
				| "federal"
				| "eu"
				| "church"
				| "other";
			funding_type_enum:
				| "workspace_program"
				| "institutional_funding"
				| "temporary_project_funding"
				| "no_funding";
			institution_action_enum:
				| "create"
				| "read"
				| "update"
				| "request_deletion"
				| "delete"
				| "publish";
			institution_status_enum:
				| "public"
				| "private"
				| "archived"
				| "draft"
				| "removal_pending";
			owner_type_enum:
				| "private"
				| "federal_property"
				| "state_property"
				| "state_property_silb"
				| "state_property_soda"
				| "state_property_other"
				| "state_property_specialized"
				| "state_property_fund"
				| "district_property"
				| "other_public_property"
				| "municipal_housing_company";
			protection_status_enum:
				| "long_term_secured"
				| "medium_term_secured"
				| "uncertain"
				| "acutely_threatened"
				| "permanently_closed"
				| "not_yet_secured";
			rental_contract_type_enum:
				| "unlimited_lease"
				| "limited_lease"
				| "hereditary_building_right"
				| "organization_ownership";
			subcategory_key_enum:
				| "studio_houses_workspace_program"
				| "studio_houses_free"
				| "studio_apartments"
				| "studios_other"
				| "art_universities"
				| "adult_education_centers"
				| "public_music_schools"
				| "private_music_schools"
				| "youth_art_schools"
				| "performing_arts_education"
				| "professional_dance_training"
				| "intensive_dance_program"
				| "professional_dance_coaching"
				| "dance_training"
				| "education_places_other"
				| "central_state_libraries"
				| "district_libraries"
				| "scientific_universal_libraries"
				| "scientific_specialized_libraries"
				| "workplace_patient_prison_libraries"
				| "libraries_other"
				| "clubs"
				| "concert_venues"
				| "concert_halls"
				| "music_theater"
				| "open_air_venues"
				| "jazz_venues"
				| "music_bars"
				| "discotheques"
				| "clubs_music_venues_other"
				| "municipal_galleries"
				| "exhibition_spaces_galleries"
				| "galleries_other"
				| "art_house_cinemas"
				| "curated_cinemas"
				| "outdoor_cinemas"
				| "cinemas_other"
				| "literature_event_venues"
				| "literature_organizers"
				| "literature_houses"
				| "bookstores"
				| "writing_places"
				| "literature_places_other"
				| "public_museums"
				| "private_museums"
				| "private_collections"
				| "memorial_sites"
				| "exhibition_spaces_museums"
				| "museums_other"
				| "cultural_urban_development_other"
				| "potential_cultural_development_spaces"
				| "potential_spaces_other"
				| "music_rehearsal_rooms"
				| "dance_rehearsal_rooms"
				| "performing_arts_rehearsal_rooms"
				| "rehearsal_rooms_other"
				| "project_spaces_event_centers"
				| "project_spaces_workspace_program"
				| "project_spaces_initiatives_other"
				| "cultural_centers"
				| "youth_leisure_facilities"
				| "neighborhood_centers"
				| "family_centers"
				| "community_empowerment_centers"
				| "social_participation_centers"
				| "sociocultural_centers_other"
				| "dance_performance"
				| "dance_young_audience"
				| "dance_contemporary_circus"
				| "dance_venues_other"
				| "theater"
				| "puppet_figure_object_theater"
				| "performing_arts_performance"
				| "performing_arts_contemporary_circus"
				| "children_circus"
				| "acrobatics"
				| "comedy"
				| "cabaret"
				| "variety"
				| "poetry_slam"
				| "opera"
				| "musical"
				| "improvisation"
				| "performing_arts_young_audience"
				| "performing_arts_venues_other"
				| "graffiti_areas_other"
				| "other"
				| "music_theater_clubs_music_venues"
				| "music_theater_performing_arts_venues"
				| "project_spaces_general"
				| "project_initiatives_general"
				| "legal_graffiti_areas"
				| "mobile_libraries"
				| "rehearsal_rooms_program"
				| "rehearsal_rooms_workspace_program";
			user_role_enum:
				| "public"
				| "institution"
				| "district_administration"
				| "division_association"
				| "state_administration"
				| "administrator"
				| "super_administrator";
			utilization_status_enum:
				| "in_use"
				| "temporarily_closed"
				| "permanently_closed"
				| "planned_use"
				| "unknown"
				| "potential_space";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			berlin_district_enum: [
				"charlottenburg_wilmersdorf",
				"friedrichshain_kreuzberg",
				"lichtenberg",
				"marzahn_hellersdorf",
				"mitte",
				"neukoelln",
				"pankow",
				"reinickendorf",
				"spandau",
				"steglitz_zehlendorf",
				"tempelhof_schoeneberg",
				"treptow_koepenick",
			],
			category_key_enum: [
				"studios",
				"education_places",
				"libraries",
				"clubs_music_venues",
				"galleries",
				"cinemas",
				"literature_places",
				"museums",
				"cultural_urban_development",
				"potential_spaces",
				"rehearsal_rooms",
				"project_spaces_initiatives",
				"sociocultural_centers",
				"dance_venues",
				"performing_arts_venues",
				"graffiti_areas",
				"other",
				"urban_art",
			],
			closing_reason_enum: [
				"lease_expired",
				"funding_discontinued",
				"ownership_change",
				"other",
			],
			funding_source_key_enum: [
				"private",
				"district",
				"state_berlin",
				"federal",
				"eu",
				"church",
				"other",
			],
			funding_type_enum: [
				"workspace_program",
				"institutional_funding",
				"temporary_project_funding",
				"no_funding",
			],
			institution_action_enum: [
				"create",
				"read",
				"update",
				"request_deletion",
				"delete",
				"publish",
			],
			institution_status_enum: [
				"public",
				"private",
				"archived",
				"draft",
				"removal_pending",
			],
			owner_type_enum: [
				"private",
				"federal_property",
				"state_property",
				"state_property_silb",
				"state_property_soda",
				"state_property_other",
				"state_property_specialized",
				"state_property_fund",
				"district_property",
				"other_public_property",
				"municipal_housing_company",
			],
			protection_status_enum: [
				"long_term_secured",
				"medium_term_secured",
				"uncertain",
				"acutely_threatened",
				"permanently_closed",
				"not_yet_secured",
			],
			rental_contract_type_enum: [
				"unlimited_lease",
				"limited_lease",
				"hereditary_building_right",
				"organization_ownership",
			],
			subcategory_key_enum: [
				"studio_houses_workspace_program",
				"studio_houses_free",
				"studio_apartments",
				"studios_other",
				"art_universities",
				"adult_education_centers",
				"public_music_schools",
				"private_music_schools",
				"youth_art_schools",
				"performing_arts_education",
				"professional_dance_training",
				"intensive_dance_program",
				"professional_dance_coaching",
				"dance_training",
				"education_places_other",
				"central_state_libraries",
				"district_libraries",
				"scientific_universal_libraries",
				"scientific_specialized_libraries",
				"workplace_patient_prison_libraries",
				"libraries_other",
				"clubs",
				"concert_venues",
				"concert_halls",
				"music_theater",
				"open_air_venues",
				"jazz_venues",
				"music_bars",
				"discotheques",
				"clubs_music_venues_other",
				"municipal_galleries",
				"exhibition_spaces_galleries",
				"galleries_other",
				"art_house_cinemas",
				"curated_cinemas",
				"outdoor_cinemas",
				"cinemas_other",
				"literature_event_venues",
				"literature_organizers",
				"literature_houses",
				"bookstores",
				"writing_places",
				"literature_places_other",
				"public_museums",
				"private_museums",
				"private_collections",
				"memorial_sites",
				"exhibition_spaces_museums",
				"museums_other",
				"cultural_urban_development_other",
				"potential_cultural_development_spaces",
				"potential_spaces_other",
				"music_rehearsal_rooms",
				"dance_rehearsal_rooms",
				"performing_arts_rehearsal_rooms",
				"rehearsal_rooms_other",
				"project_spaces_event_centers",
				"project_spaces_workspace_program",
				"project_spaces_initiatives_other",
				"cultural_centers",
				"youth_leisure_facilities",
				"neighborhood_centers",
				"family_centers",
				"community_empowerment_centers",
				"social_participation_centers",
				"sociocultural_centers_other",
				"dance_performance",
				"dance_young_audience",
				"dance_contemporary_circus",
				"dance_venues_other",
				"theater",
				"puppet_figure_object_theater",
				"performing_arts_performance",
				"performing_arts_contemporary_circus",
				"children_circus",
				"acrobatics",
				"comedy",
				"cabaret",
				"variety",
				"poetry_slam",
				"opera",
				"musical",
				"improvisation",
				"performing_arts_young_audience",
				"performing_arts_venues_other",
				"graffiti_areas_other",
				"other",
				"music_theater_clubs_music_venues",
				"music_theater_performing_arts_venues",
				"project_spaces_general",
				"project_initiatives_general",
				"legal_graffiti_areas",
				"mobile_libraries",
				"rehearsal_rooms_program",
				"rehearsal_rooms_workspace_program",
			],
			user_role_enum: [
				"public",
				"institution",
				"district_administration",
				"division_association",
				"state_administration",
				"administrator",
				"super_administrator",
			],
			utilization_status_enum: [
				"in_use",
				"temporarily_closed",
				"permanently_closed",
				"planned_use",
				"unknown",
				"potential_space",
			],
		},
	},
} as const;
