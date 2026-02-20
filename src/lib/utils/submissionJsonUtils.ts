import { Prisma } from "@/generated/prisma";

type JsonObject = Record<string, Prisma.InputJsonValue>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isTaggedDateTime = (
	value: Record<string, unknown>,
): value is { $type: "DateTime"; value: string } =>
	value.$type === "DateTime" && typeof value.value === "string";

const normalizeUnknownToJson = (value: unknown): Prisma.InputJsonValue => {
	if (value === null) return null;
	if (typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value)) {
		return value.map((item) =>
			item === undefined ? null : normalizeUnknownToJson(item),
		);
	}
	if (isPlainObject(value)) {
		if (isTaggedDateTime(value)) {
			return value.value;
		}
		const result: JsonObject = {};
		for (const [key, nested] of Object.entries(value)) {
			if (nested === undefined) continue;
			result[key] = normalizeUnknownToJson(nested);
		}
		return result;
	}
	return String(value);
};

export const normalizeSubmissionJson = (
	value: Prisma.InputJsonValue,
): Prisma.InputJsonValue => normalizeUnknownToJson(value);

export const normalizeOptionalSubmissionJson = (
	value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | undefined => {
	if (value === null || value === undefined) return undefined;
	return normalizeSubmissionJson(value);
};
