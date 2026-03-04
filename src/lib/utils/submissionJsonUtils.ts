import { Prisma } from "@/generated/prisma";

type JsonObject = Record<string, Prisma.InputJsonValue | null>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isTaggedDateTime = (
	value: Record<string, unknown>,
): value is { $type: "DateTime"; value: string } =>
	value.$type === "DateTime" && typeof value.value === "string";

const normalizeNestedJson = (value: unknown): Prisma.InputJsonValue | null => {
	if (value === null) return null;
	if (typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number")
		return Number.isFinite(value) ? value : String(value);
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value)) {
		return value.map((item) =>
			item === undefined ? null : normalizeNestedJson(item),
		);
	}
	if (isPlainObject(value)) {
		if (isTaggedDateTime(value)) {
			return value.value;
		}
		const result: JsonObject = {};
		for (const [key, nested] of Object.entries(value)) {
			if (nested === undefined) continue;
			result[key] = normalizeNestedJson(nested);
		}
		return result;
	}
	return String(value);
};

const normalizeUnknownToJson = (
	value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
	if (value === null) return Prisma.JsonNull;
	const normalized = normalizeNestedJson(value);
	return normalized === null ? Prisma.JsonNull : normalized;
};

export function normalizeSubmissionJson(
	value: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
	return normalizeUnknownToJson(value);
}

export const normalizeOptionalSubmissionJson = (
	value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | undefined => {
	if (value === null || value === undefined) return undefined;
	const normalized = normalizeNestedJson(value);
	return normalized === null ? undefined : normalized;
};
