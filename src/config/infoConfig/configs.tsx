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
		value: "email",
		labelKey: "field_names.email.label",
		type: "email",
	},
	{
		value: "phone",
		labelKey: "field_names.phone.label",
		type: "phone",
	},
	{
		value: "contact_person.first_name",
		permissionField: "contact_person.first_name",
		labelKey: "field_names.contact_person_first_name.label",
		type: "text",
	},
	{
		value: "contact_person.last_name",
		permissionField: "contact_person.last_name",
		labelKey: "field_names.contact_person_last_name.label",
		type: "text",
	},
	{
		value: "contact_person.email",
		permissionField: "contact_person.email",
		labelKey: "field_names.contact_person_email.label",
		type: "email",
	},
	{
		value: "contact_person.phone",
		permissionField: "contact_person.phone",
		labelKey: "field_names.contact_person_phone.label",
		type: "phone",
	},
];

export const detailsInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "parent_organization",
		labelKey: "field_names.parent_organization.label",
		type: "text",
	},
	{
		value: "established_since",
		labelKey: "field_names.established_since.label",
		type: "partialDate",
	},
	{
		value: "established_until",
		labelKey: "field_names.established_until.label",
		type: "partialDate",
	},
	{
		value: "closing_reason",
		labelKey: "field_names.closing_reason.label",
		type: "enum",
		enumKey: "closing_reason",
	},
	{
		value: "address.cultural_area",
		permissionField: "address.cultural_area",
		labelKey: "field_names.cultural_area.label",
		type: "text",
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
];

export const organizationInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "legal_form",
		labelKey: "field_names.legal_form.label",
		type: "enum",
		enumKey: "legal_form",
	},
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
	{
		value: "area",
		labelKey: "field_names.area.label",
		type: "text",
	},
	{
		value: "number_of_rooms",
		labelKey: "field_names.number_of_rooms.label",
		type: "text",
	},
	{
		value: "capacity",
		labelKey: "field_names.capacity.label",
		type: "text",
	},
];

export const sharedUseInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "shared_use_allowed",
		labelKey: "field_names.shared_use_allowed.label",
		type: "boolean",
	},
	{
		value: "shared_use_info",
		labelKey: "field_names.shared_use_info.label",
		type: "text",
		condition: (data) => !!(data.shared_use_allowed && data.shared_use_info),
	},
	{
		value: "shared_use_equipment",
		labelKey: "field_names.shared_use_equipment.label",
		type: "text",
		condition: (data) =>
			!!(data.shared_use_allowed && data.shared_use_equipment),
	},
	{
		value: "shared_use_audience",
		labelKey: "field_names.shared_use_audience.label",
		type: "text",
		condition: (data) =>
			!!(data.shared_use_allowed && data.shared_use_audience),
	},
	{
		value: "shared_use_availability",
		labelKey: "field_names.shared_use_availability.label",
		type: "text",
		condition: (data) =>
			!!(data.shared_use_allowed && data.shared_use_availability),
	},
	{
		value: "accessibility",
		labelKey: "field_names.accessibility.label",
		type: "text",
		condition: (data) => !!(data.shared_use_allowed && data.accessibility),
	},
	{
		value: "cost",
		labelKey: "field_names.cost.label",
		type: "text",
		condition: (data) => !!(data.shared_use_allowed && data.cost),
	},
	{
		value: "shared_use_contact_person",
		labelKey: "field_names.shared_use_contact_person.label",
		type: "text",
		condition: (data) =>
			!!(data.shared_use_allowed && data.shared_use_contact_person),
	},
];

export const additionalInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "source",
		labelKey: "field_names.source.label",
		type: "text",
	},
	{
		value: "notes",
		labelKey: "field_names.notes.label",
		type: "text",
	},
	{
		value: "internal_notes",
		labelKey: "field_names.internal_notes.label",
		type: "text",
	},
];
