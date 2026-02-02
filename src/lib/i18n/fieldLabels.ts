import type { TFunction } from "i18next";

export const getFieldLabel = (
	tEnum: TFunction,
	key: string,
	fallback?: string,
) => {
	const translated = tEnum(`field_names.${key}`);
	return translated === `field_names.${key}` ? (fallback ?? key) : translated;
};
