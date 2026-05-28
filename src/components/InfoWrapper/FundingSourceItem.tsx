"use client";

import { useTranslation } from "react-i18next";
import { InfoItem } from "./InfoItem";
import type { Institution } from "@/types";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";

export const formatFundingSourcesValue = (
	data: Partial<Institution>,
	tEnum: (key: string) => string,
): string => {
	const sources = data.funding_sources;
	if (Array.isArray(sources) && sources.length > 0) {
		const values = sources
			.map((source) => {
				const rawName =
					typeof source.source_name === "string"
						? source.source_name.trim()
						: "";
				const translatedName = rawName
					? (() => {
							return getFieldOptionLabel(tEnum, "funding_source", rawName);
						})()
					: "";
				const description =
					typeof source.description === "string"
						? source.description.trim()
						: "";

				if (!translatedName && !description) return null;
				if (!description) return translatedName;
				if (!translatedName) return description;
				return `${translatedName}: ${description}`;
			})
			.filter((entry): entry is string => Boolean(entry));
		if (values.length > 0) return values.join(" | ");
	}

	const legacyName = (data as Record<string, unknown>).funding_source_name;
	const legacyDescription = (data as Record<string, unknown>)
		.funding_source_description;

	if (typeof legacyName === "string" && typeof legacyDescription === "string") {
		return `${legacyName}: ${legacyDescription}`;
	}
	if (typeof legacyName === "string") return legacyName;
	if (typeof legacyDescription === "string") return legacyDescription;
	return "";
};

export function FundingSourceItem({
	data,
	label,
	description,
	isPrivate = false,
	action,
}: {
	data: Partial<Institution>;
	label?: string;
	description?: string;
	isPrivate?: boolean;
	action?: React.ReactNode;
}) {
	const { t: tEnum } = useTranslation();
	const value = formatFundingSourcesValue(data, tEnum);

	return (
		<InfoItem
			label={label}
			description={description}
			isPrivate={isPrivate}
			action={action}
		>
			{value}
		</InfoItem>
	);
}
