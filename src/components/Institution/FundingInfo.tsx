"use client";

import { InstitutionProperties } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface FundingInfoProps {
	institutionData: InstitutionProperties;
}

function hasFundingData(data: InstitutionProperties): boolean {
	return !!(data.support_type || data.funding_type);
}

function SupportTypeInfo({
	data,
	t,
}: {
	data: InstitutionProperties;
	t: (key: string) => string;
}) {
	if (!data.support_type) return null;
	return (
		<InfoItem label={t("institution.fundingType")}>
			{data.support_type}
		</InfoItem>
	);
}

function FundingTypeInfo({
	data,
	t,
	tEnum,
}: {
	data: InstitutionProperties;
	t: (key: string) => string;
	tEnum: (key: string) => string;
}) {
	if (!data.funding_type) return null;
	return (
		<InfoItem label={t("institution.supportType")}>
			{tEnum(`funding_type.${data.funding_type}`)}
		</InfoItem>
	);
}

export function FundingInfo({ institutionData }: FundingInfoProps) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	if (!hasFundingData(institutionData)) return null;

	return (
		<InfoSection>
			<SupportTypeInfo data={institutionData} t={t} />
			<FundingTypeInfo data={institutionData} t={t} tEnum={tEnum} />
		</InfoSection>
	);
}
