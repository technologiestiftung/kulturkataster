"use client";

import { InstitutionProperties } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface StatusInfoProps {
	institutionData: InstitutionProperties;
}

export function StatusInfo({ institutionData }: StatusInfoProps) {
	const { t } = useTranslation("common");

	// Check if there's any status info to display
	const hasData = !!institutionData.updated_at;

	if (!hasData) return null;

	return (
		<InfoSection>
			{institutionData.updated_at && (
				<InfoItem label={t("institution.status")}>
					{new Date(institutionData.updated_at).toLocaleDateString("de-DE", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
					})}
				</InfoItem>
			)}
		</InfoSection>
	);
}
