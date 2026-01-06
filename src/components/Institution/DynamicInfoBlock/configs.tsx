import type { DynamicInfoBlockConfig } from "./types";
import { ContactLink } from "../shared/ContactLink";

export const addressInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "street",
			labelKey: "institution.street",
			valueType: "text",
		},
		{
			dataPath: "city.name",
			labelKey: "institution.city",
			valueType: "text",
		},
		{
			dataPath: "zip_code",
			labelKey: "institution.postalCode",
			valueType: "text",
		},
		{
			dataPath: "district.key",
			labelKey: "institution.district",
			valueType: "enum",
			enumKey: "berlin_district",
		},
	],
};

export const contactInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "website",
			labelKey: "institution.website",
			valueType: "text",
			render: (value, data) => {
				if (!value) return "—";
				return (
					<ContactLink href={value as string} external>
						Website {data.name}
					</ContactLink>
				);
			},
		},
		{
			dataPath: "phone",
			labelKey: "institution.phoneNumber",
			valueType: "text",
			render: (value) => {
				if (!value) return "—";
				return (
					<ContactLink href={`tel:${value}`}>{value as string}</ContactLink>
				);
			},
		},
		{
			dataPath: "email",
			labelKey: "institution.emailAddress",
			valueType: "text",
			render: (value) => {
				if (!value) return "—";
				return (
					<ContactLink href={`mailto:${value}`}>{value as string}</ContactLink>
				);
			},
		},
	],
};

export const organizationInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "closing_reason",
			labelKey: "institution.closingReason",
			valueType: "text",
		},
		{
			dataPath: "cultural_area",
			labelKey: "institution.culturalArea",
			valueType: "nested",
		},
		{
			dataPath: "owner.owner_type",
			labelKey: "institution.ownerType",
			valueType: "enum",
			enumKey: "owner_type",
		},
		{
			dataPath: "source",
			labelKey: "institution.source",
			valueType: "nested",
		},
	],
};

export const fundingInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "support_type",
			labelKey: "institution.fundingType",
			valueType: "text",
		},
		{
			dataPath: "funding_type",
			labelKey: "institution.supportType",
			valueType: "enum",
			enumKey: "funding_type",
		},
	],
};

export const facilityInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "capacity",
			labelKey: "institution.usableAreaSize",
			valueType: "text",
		},
		{
			dataPath: "rooms_count",
			labelKey: "institution.workspaceCount",
			valueType: "text",
		},
		{
			dataPath: "shared_use_info",
			labelKey: "institution.description",
			valueType: "text",
			condition: (data) => !!(data.shared_use_allowed && data.shared_use_info),
		},
		{
			dataPath: "shared_use_audience",
			labelKey: "institution.sharedUseAudience",
			valueType: "text",
		},
		{
			dataPath: "established_since",
			labelKey: "institution.establishedSince",
			valueType: "year",
		},
		{
			dataPath: "established_until",
			labelKey: "institution.establishedUntil",
			valueType: "year",
		},
	],
};

export const statusInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "utilization_status",
			labelKey: "institution.utilizationStatus",
			valueType: "enum",
			enumKey: "utilization_status",
		},
		{
			dataPath: "monument_status",
			labelKey: "institution.monumentStatus",
			valueType: "enum",
			enumKey: "monument_status",
		},
	],
};

export const additionalInfoConfig: DynamicInfoBlockConfig = {
	fields: [
		{
			dataPath: "notes",
			labelKey: "institution.notes",
			valueType: "text",
		},
		{
			dataPath: "external_id",
			labelKey: "institution.externalId",
			valueType: "text",
		},
	],
};
