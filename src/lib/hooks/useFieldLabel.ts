import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
	getFieldDescription,
	getFieldError,
	getFieldLabel,
	getFieldPlaceholder,
} from "@/lib/i18n/fieldLabels";

export const useFieldLabel = () => {
	const { t: tEnum } = useTranslation();

	return useCallback(
		(key: string, _fallback?: string) => {
			return getFieldLabel(tEnum, key);
		},
		[tEnum],
	);
};

export const useFieldMeta = () => {
	const { t: tEnum } = useTranslation();

	return useCallback(
		(key: string) => ({
			label: getFieldLabel(tEnum, key),
			description: getFieldDescription(tEnum, key),
			placeholder: getFieldPlaceholder(tEnum, key),
			error: (errorKey: string) => getFieldError(tEnum, key, errorKey),
		}),
		[tEnum],
	);
};
