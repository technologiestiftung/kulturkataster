"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { ContactLink } from "./shared/ContactLink";
import { InfoItem } from "./shared/InfoItem";
import { InfoSection } from "./shared/InfoSection";

interface InstitutionContactProps {
	institutionData: Institution;
}

export function Contact({ institutionData }: InstitutionContactProps) {
	const { t } = useTranslation("common");

	return (
		<InfoSection>
			{institutionData.website && (
				<InfoItem label={t("institution.website")}>
					<ContactLink href={institutionData.website} external>
						Website {institutionData.name}
					</ContactLink>
				</InfoItem>
			)}

			{institutionData.phone && (
				<InfoItem label={t("institution.phoneNumber")}>
					<ContactLink href={`tel:${institutionData.phone}`}>
						{institutionData.phone}
					</ContactLink>
				</InfoItem>
			)}

			{institutionData.email && (
				<InfoItem label={t("institution.emailAddress")}>
					<ContactLink href={`mailto:${institutionData.email}`}>
						{institutionData.email}
					</ContactLink>
				</InfoItem>
			)}
		</InfoSection>
	);
}
