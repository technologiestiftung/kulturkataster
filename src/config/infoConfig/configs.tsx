import { InfoWrapperFieldConfig } from "@/components/InfoWrapper/types";

export const addressInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "street",
		labelKey: "field_names.street.label",
		type: "text",
	},
	{
		value: "city.name",
		labelKey: "field_names.city.label",
		type: "text",
	},
	{
		value: "zipcode",
		labelKey: "field_names.zipcode.label",
		type: "text",
	},
	{
		value: "district.key",
		labelKey: "field_names.district.label",
		type: "enum",
		enumKey: "berlin_district",
	},
];

export const contactInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "website",
		labelKey: "field_names.website.label",
		type: "link",
		enumKey: "website",
	},
	{
		value: "phone",
		labelKey: "field_names.phone.label",
		type: "phone",
	},
	{
		value: "email",
		labelKey: "field_names.email.label",
		type: "email",
	},
	{
		value: "contact_person_first_name",
		labelKey: "field_names.contact_person_first_name.label",
		type: "text",
	},
	{
		value: "contact_person_last_name",
		labelKey: "field_names.contact_person_last_name.label",
		type: "text",
	},
	{
		value: "contact_person_email",
		labelKey: "field_names.contact_person_email.label",
		type: "email",
	},
	{
		value: "contact_person_phone",
		labelKey: "field_names.contact_person_phone.label",
		type: "phone",
	},
];

export const organizationInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "parent_organization",
		labelKey: "field_names.parent_organization.label",
		type: "text",
	},
	{
		value: "legal_form",
		labelKey: "field_names.legal_form.label",
		type: "text",
	},
	{
		value: "closing_reason",
		labelKey: "field_names.closing_reason.label",
		type: "enum",
		enumKey: "closing_reason",
	},
	{
		value: "cultural_area",
		labelKey: "field_names.cultural_area.label",
		type: "nested",
	},
	{
		value: "owner_type",
		labelKey: "field_names.owner_type.label",
		type: "enum",
		enumKey: "owner_type",
	},
	{
		value: "owner_name",
		labelKey: "field_names.owner_name.label",
		type: "text",
	},
	{
		value: "rental_contract_type",
		labelKey: "field_names.rental_contract_type.label",
		type: "enum",
		enumKey: "rental_contract_type",
	},
	{
		value: "rental_contract_end",
		labelKey: "field_names.rental_contract_end.label",
		type: "date",
	},
	{
		value: "source",
		labelKey: "field_names.source.label",
		type: "text",
	},
];

export const fundingInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "funding_type",
		labelKey: "field_names.funding_type.label",
		type: "enum",
		enumKey: "funding_type",
	},
	{
		value: "funding_sources",
		labelKey: "field_names.funding_source_name.label",
		type: "fundingSources",
	},
];

export const facilityInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "area",
		labelKey: "field_names.area.label",
		type: "text",
	},
	{
		value: "capacity",
		labelKey: "field_names.capacity.label",
		type: "text",
	},
	{
		value: "number_of_rooms",
		labelKey: "field_names.number_of_rooms.label",
		type: "text",
	},
	{
		value: "accessibility",
		labelKey: "field_names.accessibility.label",
		type: "text",
	},
	{
		value: "cost",
		labelKey: "field_names.cost.label",
		type: "text",
	},
	{
		value: "shared_use_info",
		labelKey: "field_names.shared_use_info.label",

		type: "text",
		condition: (data) => !!(data.shared_use_allowed && data.shared_use_info),
	},
	{
		value: "shared_use_allowed",
		labelKey: "field_names.shared_use_allowed.label",
		type: "boolean",
	},
	{
		value: "shared_use_audience",
		labelKey: "field_names.shared_use_audience.label",
		type: "text",
	},
	{
		value: "established_since",
		labelKey: "field_names.established_since.label",
		type: "year",
	},
	{
		value: "established_until",
		labelKey: "field_names.established_until.label",
		type: "year",
	},
];

export const statusInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "utilization_status_info",
		labelKey: "field_names.utilization_status_info.label",
		type: "text",
	},
	{
		value: "utilization_status_internal_notes",
		labelKey: "field_names.utilization_status_internal_notes.label",
		type: "text",
	},
	{
		value: "protection_status",
		labelKey: "field_names.protection_status.label",
		type: "enum",
		enumKey: "protection_status",
	},
	{
		value: "protection_status_info",
		labelKey: "field_names.protection_status_info.label",
		type: "text",
	},
];

export const additionalInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "notes",
		labelKey: "field_names.notes.label",
		type: "text",
	},
];
