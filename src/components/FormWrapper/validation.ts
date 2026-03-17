import type { TFunction } from "i18next";
import { getFieldError, getFieldLabel } from "@/lib/i18n/fieldLabels";
import { normalizeUrl } from "@/lib/utils/sanitizerUtils";
import type {
	FieldNormalizer,
	FieldValidator,
	FormWrapperFieldConfig,
} from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_REGEX = /^\+?[0-9\s()./-]{3,}$/;
const IPV4_HOST_REGEX =
	/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_HOST_REGEX = /^\[[0-9a-f:]+\]$/i;

const withNormalizer = (
	validate: (value: unknown, formData: Record<string, unknown>) => string | undefined,
	normalize?: FieldNormalizer,
): FieldValidator =>
	Object.assign(validate, normalize ? { normalize } : {});

const isEmptyValue = (value: unknown) =>
	value === undefined ||
	value === null ||
	value === "" ||
	(Array.isArray(value) && value.length === 0);

const isValidUrlHostname = (hostname: string) => {
	if (hostname === "localhost") return true;
	if (IPV4_HOST_REGEX.test(hostname) || IPV6_HOST_REGEX.test(hostname)) {
		return true;
	}

	const labels = hostname.split(".");
	return (
		labels.length >= 2 &&
		labels.every(
			(label) =>
				/^[a-z0-9-]+$/i.test(label) &&
				!label.startsWith("-") &&
				!label.endsWith("-"),
		) &&
		/[a-z]{2,}$/i.test(labels[labels.length - 1] ?? "")
	);
};

const isValidUrlValue = (value: string) => {
	try {
		const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
			? value
			: `https://${value}`;
		const parsedUrl = new URL(candidate);
		return (
			["http:", "https:"].includes(parsedUrl.protocol) &&
			Boolean(parsedUrl.hostname) &&
			isValidUrlHostname(parsedUrl.hostname)
		);
	} catch {
		return false;
	}
};

const getFieldMetaKey = (field: FormWrapperFieldConfig) =>
	field.type === "section" ? field.name : (field.fieldMetaKey ?? field.name);

const getTypeValidationMessage = (
	field: FormWrapperFieldConfig,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
	fallbackKey:
		| "invalidEmail"
		| "invalidNumber"
		| "invalidPhone"
		| "invalidUrl",
) => {
	const fieldMetaKey = getFieldMetaKey(field);
	const fieldMessage =
		field.type !== "section" ? field.errorMessages?.invalid : undefined;
	const translatedFieldMessage = getFieldError(tEnum, fieldMetaKey, "invalid");

	if (fieldMessage) return fieldMessage;
	if (translatedFieldMessage !== `field_names.${fieldMetaKey}.errors.invalid`) {
		return translatedFieldMessage;
	}

	return t(`form.validation.${fallbackKey}`);
};

const buildRequiredValidator = (
	field: FormWrapperFieldConfig,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
) => {
	const fieldMetaKey = getFieldMetaKey(field);
	const fieldLabel = field.label ?? getFieldLabel(tEnum, fieldMetaKey);
	const requiredDefault = t("form.validation.required", {
		field: fieldLabel,
	});
	const requiredMessageRaw =
		field.requiredMessage ??
		(field.type !== "section" ? field.errorMessages?.required : undefined) ??
		getFieldError(tEnum, fieldMetaKey, "required");
	const requiredMessage =
		requiredMessageRaw === `field_names.${fieldMetaKey}.errors.required`
			? requiredDefault
			: requiredMessageRaw;

	return withNormalizer((value) => {
		if (field.type === "checkbox" && value !== true) {
			return requiredMessage;
		}
		return isEmptyValue(value) ? requiredMessage : undefined;
	});
};

const buildTypeValidator = (
	field: FormWrapperFieldConfig,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
) => {
	if (field.type === "section") return undefined;

	if (field.type === "email") {
		return email(getTypeValidationMessage(field, t, tEnum, "invalidEmail"));
	}
	if (field.type === "number") {
		return numeric(getTypeValidationMessage(field, t, tEnum, "invalidNumber"));
	}
	if (field.type === "tel") {
		return tel(getTypeValidationMessage(field, t, tEnum, "invalidPhone"));
	}
	if (field.type === "url") {
		return url({
			message: getTypeValidationMessage(field, t, tEnum, "invalidUrl"),
			normalize: true,
		});
	}

	return undefined;
};

const getLegacyValidators = (field: FormWrapperFieldConfig): FieldValidator[] => {
	const validators: FieldValidator[] = [];

	if (field.validate) {
		validators.push(withNormalizer((value) => field.validate?.(value)));
	}

	if (field.validateWithForm) {
		validators.push(
			withNormalizer((value, formData) => field.validateWithForm?.(value, formData)),
		);
	}

	return validators;
};

export const required = (message: string): FieldValidator =>
	withNormalizer((value) => (isEmptyValue(value) ? message : undefined));

export const email = (message: string): FieldValidator =>
	withNormalizer((value) => {
		if (typeof value !== "string" || value.trim().length === 0) {
			return undefined;
		}
		return EMAIL_REGEX.test(value.trim()) ? undefined : message;
	});

export const numeric = (message: string): FieldValidator =>
	withNormalizer((value) => {
		if (typeof value !== "string" || value.trim().length === 0) {
			return undefined;
		}
		return Number.isFinite(Number(value.trim())) ? undefined : message;
	});

export const tel = (message: string): FieldValidator =>
	withNormalizer((value) => {
		if (typeof value !== "string" || value.trim().length === 0) {
			return undefined;
		}
		return TEL_REGEX.test(value.trim()) ? undefined : message;
	});

export const url = ({
	message,
	normalize = false,
}: {
	message: string;
	normalize?: boolean;
}): FieldValidator =>
	withNormalizer(
		(value) => {
			if (typeof value !== "string" || value.trim().length === 0) {
				return undefined;
			}
			return isValidUrlValue(value.trim()) ? undefined : message;
		},
		normalize
			? (value) =>
					typeof value === "string" && value.trim().length > 0
						? normalizeUrl(value)
						: value
			: undefined,
	);

export const matchesField = (
	fieldName: string,
	message: string,
): FieldValidator =>
	withNormalizer((value, formData) =>
		value !== formData[fieldName] ? message : undefined,
	);

const getFieldValidators = (
	field: FormWrapperFieldConfig,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
) => {
	const typeValidator = buildTypeValidator(field, t, tEnum);
	const validators =
		field.type !== "section" && field.validators && field.validators.length > 0
			? field.validators
			: [
					...(field.required ? [buildRequiredValidator(field, t, tEnum)] : []),
					...(typeValidator ? [typeValidator] : []),
				];

	return [...validators, ...getLegacyValidators(field)];
};

export const normalizeFieldValue = (
	field: FormWrapperFieldConfig,
	value: unknown,
	formData: Record<string, unknown>,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
) =>
	getFieldValidators(field, t, tEnum).reduce(
		(nextValue, validator) =>
			validator.normalize ? validator.normalize(nextValue, formData) : nextValue,
		value,
	);

export const validateFieldValue = (
	field: FormWrapperFieldConfig,
	value: unknown,
	formData: Record<string, unknown>,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
) => {
	const normalizedValue = normalizeFieldValue(field, value, formData, t, tEnum);
	const nextFormData = { ...formData, [field.name]: normalizedValue };

	for (const validator of getFieldValidators(field, t, tEnum)) {
		const error = validator(normalizedValue, nextFormData);
		if (error) return error;
	}

	return undefined;
};
