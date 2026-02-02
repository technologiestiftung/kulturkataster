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
	{
		value: "contact_person_name",
		labelKey: "institution.contactPersonName",
		type: "text",
	},
	{
		value: "contact_person_email",
		labelKey: "institution.contactPersonEmail",
		type: "email",
	},
	{
		value: "contact_person_phone",
		labelKey: "institution.contactPersonPhone",
		type: "phone",
	},
];

export const organizationInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "parent_organization",
		labelKey: "institution.parentOrganization",
		type: "text",
	},
	{
		value: "legal_form",
		labelKey: "institution.legalForm",
		type: "text",
	},
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
		value: "owner_type",
		labelKey: "institution.ownerType",
		type: "enum",
		enumKey: "owner_type",
	},
	{
		value: "owner_name",
		labelKey: "institution.ownerName",
		type: "text",
	},
	{
		value: "rental_contract_type",
		labelKey: "institution.rentalContractType",
		type: "enum",
		enumKey: "rental_contract_type",
	},
	{
		value: "rental_contract_end",
		labelKey: "institution.rentalContractEnd",
		type: "date",
	},
	{
		value: "source",
		labelKey: "institution.source",
		type: "text",
	},
];

export const fundingInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "funding_type",
		labelKey: "institution.fundingType",
		type: "enum",
		enumKey: "funding_type",
	},
	{
		value: "funding_source_name",
		labelKey: "institution.fundingSourceName",
		type: "text",
	},
	{
		value: "funding_source_description",
		labelKey: "institution.fundingSourceDescription",
		type: "text",
	},
];

export const facilityInfoConfig: InfoWrapperFieldConfig[] = [
	{
		value: "area",
		labelKey: "institution.area",
		type: "text",
	},
	{
		value: "capacity",
		labelKey: "institution.capacity",
		type: "text",
	},
	{
		value: "number_of_rooms",
		labelKey: "institution.workspaceCount",
		type: "text",
	},
	{
		value: "accessibility",
		labelKey: "institution.accessibility",
		type: "text",
	},
	{
		value: "cost",
		labelKey: "institution.cost",
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
		value: "utilization_status_info",
		labelKey: "institution.utilizationStatusInfo",
		type: "text",
	},
	{
		value: "protection_status",
		labelKey: "institution.protectionStatus",
		type: "enum",
		enumKey: "protection_status",
	},
	{
		value: "protection_status_info",
		labelKey: "institution.protectionStatusInfo",
		type: "text",
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
