import { InfoWrapperFieldConfig } from "@/components/InfoWrapper/types";

export const addressInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "street",
		labelKey: "institution.street",
		type: "text",
	},
	{
		value: "city.name",
		labelKey: "institution.city",
		type: "text",
	},
	{
		value: "zipcode",
		labelKey: "institution.postalCode",
		type: "text",
	},
	{
		value: "district.key",
		labelKey: "institution.district",
		type: "enum",
		enumKey: "berlin_district",
	},
];

export const contactInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "website",
		labelKey: "institution.website",
		type: "link",
		enumKey: "website",
	},
	{
		value: "phone",
		labelKey: "institution.phoneNumber",
		type: "phone",
	},
	{
		value: "email",
		labelKey: "institution.emailAddress",
		type: "email",
	},
];

export const organizationInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "closing_reason",
		labelKey: "institution.closingReason",
		type: "text",
	},
	{
		value: "cultural_area",
		labelKey: "institution.culturalArea",
		type: "nested",
	},
	{
		value: "owner.owner_type",
		labelKey: "institution.ownerType",
		type: "enum",
		enumKey: "owner_type",
	},
	{
		value: "source",
		labelKey: "institution.source",
		type: "text",
	},
];

export const fundingInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "support_type",
		labelKey: "institution.fundingType",
		type: "text",
	},
	{
		value: "funding_type",
		labelKey: "institution.supportType",
		type: "enum",
		enumKey: "funding_type",
	},
];

export const facilityInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "capacity",
		labelKey: "institution.usableAreaSize",
		type: "text",
	},
	{
		value: "number_of_rooms",
		labelKey: "institution.workspaceCount",
		type: "text",
	},
	{
		value: "shared_use_info",
		labelKey: "institution.description",
		type: "text",
		condition: (data) => !!(data.shared_use_allowed && data.shared_use_info),
	},
	{
		value: "shared_use_allowed",
		labelKey: "institution.sharedUseAllowed",
		type: "boolean",
	},
	{
		value: "shared_use_audience",
		labelKey: "institution.sharedUseAudience",
		type: "text",
	},
	{
		value: "established_since",
		labelKey: "institution.establishedSince",
		type: "year",
	},
	{
		value: "established_until",
		labelKey: "institution.establishedUntil",
		type: "year",
	},
];

export const statusInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "monument_status",
		labelKey: "institution.monumentStatus",
		type: "enum",
		enumKey: "monument_status",
	},
];

export const additionalInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "notes",
		labelKey: "institution.notes",
		type: "text",
	},
	{
		value: "updated_at",
		labelKey: "institution.updatedAt",
		type: "date",
	},
	{
		value: "external_id",
		labelKey: "institution.externalId",
		type: "text",
	},
];
