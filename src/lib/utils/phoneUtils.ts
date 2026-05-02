const PHONE_FORMATTING_CONTROL_REGEX = /[\p{Cf}\u200B-\u200D\uFEFF]/gu;
const PHONE_REGEX = /^\+?[0-9\s()./-]{3,}$/;

export const normalizePhoneInput = (value: string) => {
	return value.replace(PHONE_FORMATTING_CONTROL_REGEX, "").trim();
};

export const isValidPhoneValue = (value: string) =>
	PHONE_REGEX.test(normalizePhoneInput(value));
