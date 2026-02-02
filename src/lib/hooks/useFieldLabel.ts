import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getFieldLabel } from "@/lib/i18n/fieldLabels";

export const useFieldLabel = () => {
	const { t: tEnum } = useTranslation("enumMap");

	return useCallback(
		(key: string, fallback?: string) => {
			return getFieldLabel(tEnum, key, fallback);
		},
		[tEnum],
	);
};
