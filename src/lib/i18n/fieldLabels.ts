import type { TFunction } from "i18next";

export const getFieldLabel = (tEnum: TFunction, key: string) => {
	return tEnum(`field_names.${key}.label`);
};

export const getFieldDescription = (tEnum: TFunction, key: string) => {
	const translationKey = `field_names.${key}.description`;
	const translated = tEnum(translationKey);
	return translated === translationKey ? "" : translated;
};

export const getFieldPlaceholder = (tEnum: TFunction, key: string) => {
	return tEnum(`field_names.${key}.placeholder`);
};

export const getFieldError = (
	tEnum: TFunction,
	key: string,
	errorKey: string,
) => {
	return tEnum(`field_names.${key}.errors.${errorKey}`);
};
