"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface OrganizationInfoProps {
	institutionData: Institution;
}

function hasOrganizationData(data: Institution): boolean {
	return !!(
		data.closing_reason ||
		data.cultural_area ||
		data.owner?.owner_type ||
		data.source
	);
}

function ClosingReasonInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.closing_reason) return null;
	return (
		<InfoItem label={t("institution.closingReason")}>
			{data.closing_reason}
		</InfoItem>
	);
}

function CulturalAreaInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.cultural_area) return null;
	return (
		<InfoItem label={t("institution.culturalArea")}>
			{data.cultural_area.name}
		</InfoItem>
	);
}

function OwnerTypeInfo({
	data,
	t,
	tEnum,
}: {
	data: Institution;
	t: (key: string) => string;
	tEnum: (key: string) => string;
}) {
	if (!data.owner?.owner_type) return null;
	return (
		<InfoItem label={t("institution.ownerType")}>
			{tEnum("owner_type." + data.owner.owner_type)}
		</InfoItem>
	);
}

function SourceInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.source) return null;
	return (
		<InfoItem label={t("institution.source")}>{data.source.name}</InfoItem>
	);
}

export function OrganizationInfo({ institutionData }: OrganizationInfoProps) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	if (!hasOrganizationData(institutionData)) return null;

	return (
		<InfoSection>
			<ClosingReasonInfo data={institutionData} t={t} />
			<CulturalAreaInfo data={institutionData} t={t} />
			<OwnerTypeInfo data={institutionData} t={t} tEnum={tEnum} />
			<SourceInfo data={institutionData} t={t} />
		</InfoSection>
	);
}
