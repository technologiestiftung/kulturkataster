import type { Category } from "@/types/category";
import type { Submission } from "@/types/submission";
import type { Institution, InstitutionTableRow, SubmissionRow } from "@/types";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";

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

const buildSubmissionContactPerson = (
	draft: ReturnType<typeof institutionSubmissionToDraft>,
) => {
	const contactPerson = {
		id: draft.contact_person_id ?? undefined,
		first_name: draft.contact_person_first_name ?? null,
		last_name: draft.contact_person_last_name ?? null,
		email: draft.contact_person_email ?? null,
		phone: draft.contact_person_phone ?? null,
	};
	const hasContactPersonValue = Object.values(contactPerson).some(
		(value) => value !== null && typeof value !== "undefined" && value !== "",
	);
	return hasContactPersonValue
		? (contactPerson as Institution["contact_person"])
		: null;
};

export const isSubmissionRow = (
	row: InstitutionTableRow,
): row is SubmissionRow => row.rowKind === "submission";

export const formatFundingSources = (
	row: InstitutionTableRow,
	options?: {
		translateFundingSource?: (value: string) => string;
	},
) => {
	const sources = row.funding_sources;
	if (Array.isArray(sources) && sources.length > 0) {
		const values = sources
			.map((source) => {
				const rawName =
					typeof source.source_name === "string"
						? source.source_name.trim()
						: "";
				const name = rawName
					? (options?.translateFundingSource?.(rawName) ?? rawName)
					: "";
				const description =
					typeof source.description === "string"
						? source.description.trim()
						: "";
				if (!name && !description) return null;
				if (!description) return name;
				if (!name) return description;
				return `${name}: ${description}`;
			})
			.filter((value): value is string => Boolean(value));
		if (values.length > 0) return values.join(" | ");
	}

	const legacyName = (row as Record<string, unknown>).funding_source_name;
	const legacyDescription = (row as Record<string, unknown>)
		.funding_source_description;

	if (typeof legacyName === "string" && typeof legacyDescription === "string") {
		return `${legacyName}: ${legacyDescription}`;
	}
	if (typeof legacyName === "string") return legacyName;
	if (typeof legacyDescription === "string") return legacyDescription;
	return "—";
};

export const buildSubmissionRow = (
	submission: Submission,
	categories: Category[],
): SubmissionRow => {
	const data = (submission.data ?? {}) as Record<string, unknown>;
	const draft = institutionSubmissionToDraft(submission);
	const addressFromData =
		draft.address ??
		(typeof data.address === "object" && data.address
			? (data.address as Institution["address"])
			: buildAddressFromFormData(data));
	const categoriesFromData = resolveSubmissionCategories(
		draft.categoryIds ?? data.categoryIds,
		categories,
	);
	const contactPerson = buildSubmissionContactPerson(draft);

	return {
		rowKind: "submission",
		rowKey: `submission-${submission.id}`,
		submissionId: submission.id,
		id: submission.id,
		name: draft.name || "-",
		status: submission.status,
		email: draft.email ?? null,
		phone: draft.phone ?? null,
		website: draft.website ?? null,
		parent_organization: draft.parent_organization ?? null,
		address: addressFromData,
		categories: categoriesFromData,
		tags: [],
		users: [],
		groups: [],
		contact_person: contactPerson,
		contact_person_id: draft.contact_person_id ?? null,
		created_at: submission.created_at,
		updated_at: submission.updated_at,
		submissionType: submission.type,
	};
};
