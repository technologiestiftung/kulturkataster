"use client";

import { InstitutionProperties } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface FacilityInfoProps {
	institutionData: InstitutionProperties;
}

export function FacilityInfo({ institutionData }: FacilityInfoProps) {
	const { t } = useTranslation("common");

	// Check if there's any facility info to display
	const hasData = !!(
		institutionData.capacity ||
		institutionData.rooms_count ||
		institutionData.shared_use_allowed ||
		institutionData.shared_use_audience ||
		institutionData.established_since ||
		institutionData.established_until
	);

	if (!hasData) return null;

	return (
		<InfoSection>
			{institutionData.capacity && (
				<InfoItem label={t("institution.usableAreaSize")}>
					{institutionData.capacity}
				</InfoItem>
			)}
			{institutionData.rooms_count && (
				<InfoItem label={t("institution.workspaceCount")}>
					{institutionData.rooms_count}
				</InfoItem>
			)}
			{institutionData.shared_use_allowed && (
				<InfoItem label={t("institution.description")}>
					{institutionData.shared_use_info && institutionData.shared_use_info}
				</InfoItem>
			)}
			{institutionData.shared_use_audience && (
				<InfoItem label={t("institution.sharedUseAudience")}>
					{institutionData.shared_use_audience}
				</InfoItem>
			)}
			{institutionData.established_since && (
				<InfoItem label={t("institution.establishedSince")}>
					{new Date(institutionData.established_since).getFullYear()}
				</InfoItem>
			)}
			{institutionData.established_until && (
				<InfoItem label={t("institution.establishedUntil")}>
					{new Date(institutionData.established_until).getFullYear()}
				</InfoItem>
			)}
		</InfoSection>
	);
}
