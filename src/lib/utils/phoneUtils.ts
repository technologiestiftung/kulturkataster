const PHONE_FORMATTING_CONTROL_REGEX = /[\p{Cf}\u200B-\u200D\uFEFF]/gu;
const PHONE_REGEX = /^\+?[0-9\s()./-]{3,}$/;

export function normalizePhoneInput(value: string): string;
export function normalizePhoneInput(value: unknown): unknown;
export function normalizePhoneInput(value: unknown) {
	if (typeof value !== "string") return value;
	return value.replace(PHONE_FORMATTING_CONTROL_REGEX, "").trim();
}

export const isValidPhoneValue = (value: string) =>
	PHONE_REGEX.test(normalizePhoneInput(value));
