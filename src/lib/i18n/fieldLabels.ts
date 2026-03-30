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

export const getFieldOptionLabel = (
	tEnum: TFunction,
	key: string,
	value: string,
) => {
	const fieldOptionKey = `field_names.${key}.options.${value}`;
	const fieldOptionTranslation = tEnum(fieldOptionKey);
	if (fieldOptionTranslation !== fieldOptionKey) {
		return fieldOptionTranslation;
	}

	const legacyKey = `${key}.${value}`;
	const legacyTranslation = tEnum(legacyKey);
	return legacyTranslation === legacyKey ? value : legacyTranslation;
};

export const getFieldError = (
	tEnum: TFunction,
	key: string,
	errorKey: string,
) => {
	return tEnum(`field_names.${key}.errors.${errorKey}`);
};
