"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "../shared/InfoItem";
import { InfoSection } from "../shared/InfoSection";
import type { DynamicInfoBlockConfig, InfoFieldConfig } from "./types";
import { formatFieldValue, hasDisplayValue } from "./valueFormatters";

interface DynamicInfoBlockProps {
	institutionData: Institution;
	config: DynamicInfoBlockConfig;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	return path.split(".").reduce((current, key) => {
		if (current && typeof current === "object") {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj as unknown);
}

export function DynamicInfoBlock({
	institutionData,
	config,
}: DynamicInfoBlockProps) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");

	const renderField = (fieldConfig: InfoFieldConfig) => {
		if (fieldConfig.condition && !fieldConfig.condition(institutionData)) {
			return null;
		}

		const value = getNestedValue(
			institutionData as unknown as Record<string, unknown>,
			fieldConfig.dataPath,
		);

		if (!config.alwaysShow && !hasDisplayValue(value)) {
			return null;
		}

		if (fieldConfig.render) {
			return (
				<InfoItem
					key={fieldConfig.dataPath}
					label={t(fieldConfig.labelKey)}
					alwaysShow={config.alwaysShow}
				>
					{fieldConfig.render(value, institutionData)}
				</InfoItem>
			);
		}

		let displayValue: React.ReactNode = "—";

		if (hasDisplayValue(value)) {
			displayValue = formatFieldValue(value, {
				valueType: fieldConfig.valueType,
				enumKey: fieldConfig.enumKey,
				tEnum,
				tCommon: t,
			});
		}

		return (
			<InfoItem
				key={fieldConfig.dataPath}
				label={t(fieldConfig.labelKey)}
				alwaysShow={config.alwaysShow}
			>
				{displayValue}
			</InfoItem>
		);
	};

	return (
		<InfoSection alwaysShow={config.alwaysShow}>
			{config.fields.map(renderField)}
		</InfoSection>
	);
}
