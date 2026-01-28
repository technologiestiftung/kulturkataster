import type { Category } from "@/types/category";
import type { Submission } from "@/types/submission";
import type { Institution, InstitutionTableRow, SubmissionRow } from "@/types";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
import { submissionToInstitutionDraft } from "@/lib/utils/submissionUtils";

const toNumberArray = (value: unknown): number[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item));
};

const resolveSubmissionCategories = (
	categoryIds: unknown,
	categories: Category[],
) => {
	if (!Array.isArray(categoryIds) || categories.length === 0) {
		return [];
	}
	const ids = toNumberArray(categoryIds);
	if (ids.length === 0) return [];
	const categoryMap = new Map(
		categories.map((category) => [category.id, category]),
	);
	return ids
		.map((id) => categoryMap.get(id))
		.filter((category): category is Category => Boolean(category));
};

export const isSubmissionRow = (
	row: InstitutionTableRow,
): row is SubmissionRow => row.rowKind === "submission";

export const buildSubmissionRow = (
	submission: Submission,
	categories: Category[],
): SubmissionRow => {
	const data = (submission.data ?? {}) as Record<string, unknown>;
	const draft = submissionToInstitutionDraft(submission);
	const addressFromData =
		draft.address ??
		(typeof data.address === "object" && data.address
			? (data.address as Institution["address"])
			: buildAddressFromFormData(data));
	const categoriesFromData = resolveSubmissionCategories(
		draft.categoryIds ?? data.categoryIds,
		categories,
	);

	return {
		rowKind: "submission",
		rowKey: `submission-${submission.id}`,
		submissionId: submission.id,
		id: submission.id,
		name: draft.name || "-",
		status: "approval_pending",
		email: draft.email ?? null,
		phone: draft.phone ?? null,
		website: draft.website ?? null,
		parent_organization: draft.parent_organization ?? null,
		address: addressFromData,
		categories: categoriesFromData,
		tags: [],
		users: [],
		groups: [],
		created_at: submission.created_at,
		updated_at: submission.updated_at,
	};
};
