"use client";

import { InstitutionProperties } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface FundingInfoProps {
	institutionData: InstitutionProperties;
}

export function FundingInfo({ institutionData }: FundingInfoProps) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	// Check if there's any funding info to display
	const hasData = !!(
		institutionData.support_type || institutionData.funding_type
	);

	if (!hasData) return null;

	return (
		<InfoSection>
			{institutionData.support_type && (
				<InfoItem label={t("institution.fundingType")}>
					{institutionData.support_type}
				</InfoItem>
			)}
			{institutionData.funding_type && (
				<InfoItem label={t("institution.supportType")}>
					{tEnum(`funding_type.${institutionData.funding_type}`)}
				</InfoItem>
			)}
		</InfoSection>
	);
}
