"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
import { InfoItem } from "../shared/InfoItem";
import { InfoSection } from "../shared/InfoSection";
import type { DynamicInfoBlockConfig, InfoFieldConfig } from "./types";

interface DynamicInfoBlockProps {
	institutionData: Institution;
	config: DynamicInfoBlockConfig;
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	return path.split(".").reduce((current, key) => {
		if (current && typeof current === "object") {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj as unknown);
}

// Check if field has a value
function hasValue(value: unknown): boolean {
	if (value === null || value === undefined || value === "") {
		return false;
	}
	if (value instanceof Date) {
		return !Number.isNaN(value.getTime());
	}
	if (typeof value === "object" && Object.keys(value).length === 0) {
		return false;
	}
	return true;
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

		// Get the value
		const value = getNestedValue(
			institutionData as unknown as Record<string, unknown>,
			fieldConfig.dataPath,
		);

		// Skip if no value and not in alwaysShow mode
		if (!config.alwaysShow && !hasValue(value)) {
			return null;
		}

		// Custom render function
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

		// Determine how to display the value
		let displayValue: React.ReactNode = "—";

		if (hasValue(value)) {
			switch (fieldConfig.valueType) {
				case "enum":
					if (fieldConfig.enumKey && typeof value === "string") {
						displayValue = tEnum(`${fieldConfig.enumKey}.${value}`);
					}
					break;
				case "nested":
					if (value && typeof value === "object" && "name" in value) {
						displayValue = (value as { name: string }).name;
					}
					break;
				case "year":
					if (typeof value === "number") {
						displayValue = value;
					} else if (typeof value === "string" || value instanceof Date) {
						const parsed = new Date(value);
						if (!Number.isNaN(parsed.getTime())) {
							displayValue = parsed.getFullYear();
						}
					}
					break;
				case "date":
					if (typeof value === "string" || value instanceof Date) {
						displayValue = new Date(value).toLocaleDateString();
					}
					break;
				case "boolean":
					if (typeof value === "boolean") {
						displayValue = value ? t("yes") : t("no");
					}
					break;
				case "text":
				default:
					displayValue = String(value);
					break;
			}
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
