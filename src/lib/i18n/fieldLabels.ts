import type { TFunction } from "i18next";

type Translator = TFunction | ((key: string) => string);

export const getFieldLabel = (tEnum: Translator, key: string) => {
	return tEnum(`enumMap.field_names.${key}.label`);
};

export const getFieldDescription = (tEnum: Translator, key: string) => {
	const translationKey = `enumMap.field_names.${key}.description`;
	const translated = tEnum(translationKey);
	return translated === translationKey ? "" : translated;
};

// Falls back to the raw key when a category has no translation yet (e.g. a
// newly created category whose labels have not synced), instead of showing
// the "enumMap.category.<key>" path.
export const getCategoryLabel = (tEnum: Translator, key: string) => {
	const translationKey = `enumMap.category.${key}`;
	const translated = tEnum(translationKey);
	return translated === translationKey || !translated ? key : translated;
};

export const getFieldPlaceholder = (tEnum: Translator, key: string) => {
	return tEnum(`enumMap.field_names.${key}.placeholder`);
};

export const getFieldOptionLabel = (
	tEnum: Translator,
	key: string,
	value: string,
) => {
	const fieldOptionKey = `enumMap.field_names.${key}.options.${value}`;
	const fieldOptionTranslation = tEnum(fieldOptionKey);
	if (fieldOptionTranslation !== fieldOptionKey) {
		return fieldOptionTranslation;
	}

	const legacyKey = `enumMap.${key}.${value}`;
	const legacyTranslation = tEnum(legacyKey);
	return legacyTranslation === legacyKey ? value : legacyTranslation;
};

export const getFieldError = (
	tEnum: Translator,
	key: string,
	errorKey: string,
) => {
	return tEnum(`enumMap.field_names.${key}.errors.${errorKey}`);
};
