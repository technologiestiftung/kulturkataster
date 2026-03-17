import { z } from "zod";
import { normalizeUrl } from "@/lib/utils/sanitizerUtils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_REGEX = /^\+?[0-9\s()./-]{3,}$/;
const IPV4_HOST_REGEX =
	/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_HOST_REGEX = /^\[[0-9a-f:]+\]$/i;

const trimStringInput = (value: unknown) => {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const stringToNumberInput = (value: unknown) => {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	if (trimmed.length === 0) return null;
	const numericValue = Number(trimmed);
	return Number.isFinite(numericValue) ? numericValue : value;
};

const stringToDateInput = (value: unknown) => {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

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

export const isValidUrlValue = (value: string) => {
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

export const positiveIntegerSchema = (message: string) =>
	z.preprocess(
		stringToNumberInput,
		z
			.number()
			.int(message)
			.refine((value) => value > 0, message),
	);

export const assertPositiveInteger = (value: unknown, message: string) =>
	parseWithSchema(positiveIntegerSchema(message), value);

export const requiredTextSchema = (message: string) =>
	z.preprocess(trimStringInput, z.string().min(1, message));

export const optionalTextSchema = () =>
	z.preprocess(trimStringInput, z.string().nullable().optional());

export const optionalEmailSchema = (message: string) =>
	optionalTextSchema().superRefine((value, ctx) => {
		if (typeof value === "string" && !EMAIL_REGEX.test(value)) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message });
		}
	});

export const optionalTelSchema = (message: string) =>
	optionalTextSchema().superRefine((value, ctx) => {
		if (typeof value === "string" && !TEL_REGEX.test(value)) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message });
		}
	});

export const optionalUrlSchema = (message: string) =>
	optionalTextSchema()
		.superRefine((value, ctx) => {
			if (typeof value === "string") {
				const normalizedValue = normalizeUrl(value);
				if (!isValidUrlValue(normalizedValue)) {
					ctx.addIssue({ code: z.ZodIssueCode.custom, message });
				}
			}
		})
		.transform((value) =>
			typeof value === "string" ? normalizeUrl(value) : value,
		);

export const optionalNumberSchema = (message: string) =>
	z.preprocess(
		stringToNumberInput,
		z.number().finite(message).nullable().optional(),
	);

export const optionalDateLikeSchema = (message: string) =>
	z.preprocess(
		stringToDateInput,
		z
			.union([
				z.date().refine((value) => !Number.isNaN(value.getTime()), message),
				z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
					message,
				}),
			])
			.nullable()
			.optional(),
	);

export const positiveIntegerArraySchema = (message: string) =>
	z
		.array(positiveIntegerSchema(message), { message })
		.optional()
		.transform((value) => (value ? Array.from(new Set(value)) : value));

export const stringIdArraySchema = (message: string) =>
	z
		.array(requiredTextSchema(message), { message })
		.optional()
		.transform((value) => (value ? Array.from(new Set(value)) : value));

export const recordSchema = (message: string) =>
	z.record(z.string(), z.unknown(), { message });

export const parseWithSchema = <T>(schema: z.ZodType<T>, input: unknown): T =>
	schema.parse(input);

export { z };
