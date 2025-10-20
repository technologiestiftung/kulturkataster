"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface StatusInfoProps {
	institutionData: Institution;
}

function hasStatusData(data: Institution): boolean {
	return !!data.updated_at;
}

function UpdatedAtInfo({
	data,
	t,
}: {
	data: Institution;
	t: (key: string) => string;
}) {
	if (!data.updated_at) return null;
	return (
		<InfoItem label={t("institution.status")}>
			{new Date(data.updated_at).toLocaleDateString("de-DE", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			})}
		</InfoItem>
	);
}

export function StatusInfo({ institutionData }: StatusInfoProps) {
	const { t } = useTranslation("common");

	if (!hasStatusData(institutionData)) return null;

	return (
		<InfoSection>
			<UpdatedAtInfo data={institutionData} t={t} />
		</InfoSection>
	);
}
