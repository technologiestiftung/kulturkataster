"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface FundingInfoProps {
	institutionData: Institution;
}

function hasFundingData(data: Institution): boolean {
	return !!data.funding_type;
}

function FundingTypeInfo({
	data,
	t,
	tEnum,
}: {
	data: Institution;
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
			<FundingTypeInfo data={institutionData} t={t} tEnum={tEnum} />
		</InfoSection>
	);
}
