"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface AdditionalInfoProps {
	institutionData: Institution;
}

function hasAdditionalInfo(data: Institution): boolean {
	return !!data.notes;
}

export function AdditionalInfo({ institutionData }: AdditionalInfoProps) {
	const { t } = useTranslation("common");

	if (!hasAdditionalInfo(institutionData)) return null;

	return (
		<InfoSection>
			<InfoItem label={t("institution.additionalInfo")}>
				{institutionData.notes}
			</InfoItem>
		</InfoSection>
	);
}
