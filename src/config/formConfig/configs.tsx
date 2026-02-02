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
];

export const organizationInfoConfig: InfoWrapperFieldConfig[] = [
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
		value: "owner.owner_type",
		labelKey: "field_names.owner_type",
		type: "enum",
		enumKey: "owner_type",
	},
	{
		value: "source",
		labelKey: "field_names.source",
		type: "text",
	},
];

export const fundingInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "support_type",
		labelKey: "field_names.support_type",
		type: "text",
	},
	{
		value: "funding_type",
		labelKey: "field_names.funding_type",
		type: "enum",
		enumKey: "funding_type",
	},
];

export const facilityInfoConfig: InfoWrapperFieldConfig[] = [
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
		value: "utilization_status",
		labelKey: "field_names.utilization_status",
		type: "enum",
		enumKey: "utilization_status",
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
