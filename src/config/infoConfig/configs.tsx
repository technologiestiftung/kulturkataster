import { InfoWrapperFieldConfig } from "@/components/InfoWrapper/types";

export const addressInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "street",
		labelKey: "field_names.street",
		type: "text",
	},
	{
		value: "city.name",
		labelKey: "field_names.city",
		type: "text",
	},
	{
		value: "zipcode",
		labelKey: "field_names.zip",
		type: "text",
	},
	{
		value: "district.key",
		labelKey: "field_names.district",
		type: "enum",
		enumKey: "berlin_district",
	},
];

export const contactInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "website",
		labelKey: "field_names.website",
		type: "link",
		enumKey: "website",
	},
	{
		value: "phone",
		labelKey: "field_names.phone",
		type: "phone",
	},
	{
		value: "email",
		labelKey: "field_names.email",
		type: "email",
	},
	{
		value: "contact_person_name",
		labelKey: "field_names.contact_person_name",
		type: "text",
	},
	{
		value: "contact_person_email",
		labelKey: "field_names.contact_person_email",
		type: "email",
	},
	{
		value: "contact_person_phone",
		labelKey: "field_names.contact_person_phone",
		type: "phone",
	},
];

export const organizationInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "parent_organization",
		labelKey: "field_names.parent_organization",
		type: "text",
	},
	{
		value: "legal_form",
		labelKey: "field_names.legal_form",
		type: "text",
	},
	{
		value: "closing_reason",
		labelKey: "field_names.closing_reason",
		type: "text",
	},
	{
		value: "cultural_area",
		labelKey: "field_names.cultural_area",
		type: "nested",
	},
	{
		value: "owner_type",
		labelKey: "field_names.owner_type",
		type: "enum",
		enumKey: "owner_type",
	},
	{
		value: "owner_name",
		labelKey: "field_names.owner_name",
		type: "text",
	},
	{
		value: "rental_contract_type",
		labelKey: "field_names.rental_contract_type",
		type: "enum",
		enumKey: "rental_contract_type",
	},
	{
		value: "rental_contract_end",
		labelKey: "field_names.rental_contract_end",
		type: "date",
	},
	{
		value: "source",
		labelKey: "field_names.source",
		type: "text",
	},
];

export const fundingInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "funding_type",
		labelKey: "field_names.funding_type",
		type: "enum",
		enumKey: "funding_type",
	},
	{
		value: "funding_source_name",
		labelKey: "field_names.funding_source_name",
		type: "text",
	},
	{
		value: "funding_source_description",
		labelKey: "field_names.funding_source_description",
		type: "text",
	},
];

export const facilityInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "area",
		labelKey: "field_names.area",
		type: "text",
	},
	{
		value: "capacity",
		labelKey: "field_names.capacity",
		type: "text",
	},
	{
		value: "number_of_rooms",
		labelKey: "field_names.number_of_rooms",
		type: "text",
	},
	{
		value: "accessibility",
		labelKey: "field_names.accessibility",
		type: "text",
	},
	{
		value: "cost",
		labelKey: "field_names.cost",
		type: "text",
	},
	{
		value: "shared_use_info",
		labelKey: "field_names.shared_use_info",

		type: "text",
		condition: (data) => !!(data.shared_use_allowed && data.shared_use_info),
	},
	{
		value: "shared_use_allowed",
		labelKey: "field_names.shared_use_allowed",
		type: "boolean",
	},
	{
		value: "shared_use_audience",
		labelKey: "field_names.shared_use_audience",
		type: "text",
	},
	{
		value: "established_since",
		labelKey: "field_names.established_since",
		type: "year",
	},
	{
		value: "established_until",
		labelKey: "field_names.established_until",
		type: "year",
	},
];

export const statusInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "utilization_status_info",
		labelKey: "field_names.utilization_status_info",
		type: "text",
	},
	{
		value: "protection_status",
		labelKey: "field_names.protection_status",
		type: "enum",
		enumKey: "protection_status",
	},
	{
		value: "protection_status_info",
		labelKey: "field_names.protection_status_info",
		type: "text",
	},
];

export const additionalInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "notes",
		labelKey: "field_names.notes",
		type: "text",
	},
	{
		value: "updated_at",
		labelKey: "field_names.updated_at",
		type: "date",
	},
	{
		value: "external_id",
		labelKey: "field_names.external_id",
		type: "text",
	},
];
