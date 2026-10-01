import type { Prisma } from "@/generated/prisma";
import { CULTURE_INDEX_FIELDS } from "@/lib/constants/cultureIndexRanges";
import { canFields, type AccessContext } from "@/server/utils/rbac";

type SubmissionJson = Prisma.InputJsonValue | null | undefined;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const omitCultureIndexFields = <T extends SubmissionJson>(value: T): T => {
	const json: unknown = value;
	if (!isPlainObject(json)) return value;
	const rest = { ...json };
	for (const field of CULTURE_INDEX_FIELDS) delete rest[field];
	return rest as T;
};

// The culture index is admin-only. Submissions are applied with the reviewer's
// permissions, so values from a submitter who can't read the culture index would
// otherwise be written on approval. The dimensions inherit culture_index's
// permissions, so one check covers all of them.
export const stripUnreadableCultureIndex = <
	T extends { data?: SubmissionJson; diff?: SubmissionJson },
>(
	ctx: AccessContext,
	payload: T,
): T => {
	if (canFields(ctx, "institution", ["culture_index"], "read")) return payload;
	return {
		...payload,
		data: omitCultureIndexFields(payload.data),
		diff: omitCultureIndexFields(payload.diff),
	};
};
