import type { Submission } from "@/types/submission";
import type { InstitutionForm } from "@/types/institution";
import {
	buildAddressFromFormData,
	toNumberArray,
	toStringArray,
} from "@/lib/utils/formUtils";
import {
	FundingType,
	InstitutionStatus,
	OwnerType,
	ProtectionStatus,
	RentalContractType,
	UtilizationStatus,
} from "@/generated/prisma";

type SubmissionLike =
	| Submission
	| { data?: Record<string, unknown> | undefined };

const toDateInput = (value: unknown): Date | undefined => {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? undefined : value;
	}
	if (value && typeof value === "object") {
		const tagged = value as { $type?: unknown; value?: unknown };
		if (
			tagged.$type === "DateTime" &&
			(typeof tagged.value === "string" || typeof tagged.value === "number")
		) {
			const parsed = new Date(tagged.value);
			return Number.isNaN(parsed.getTime()) ? undefined : parsed;
		}
	}
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed;
	}
	return undefined;
};

export const institutionSubmissionToDraft = (
	submission: SubmissionLike,
): InstitutionForm => {
	const data = (submission.data ?? {}) as Record<string, unknown>;
	const address =
		typeof data.address === "object" && data.address
			? (data.address as InstitutionForm["address"])
			: buildAddressFromFormData(data);

	const toString = (value: unknown): string | undefined =>
		typeof value === "string" ? value : undefined;
	const toNumber = (value: unknown): number | undefined =>
		typeof value === "number" && Number.isFinite(value) ? value : undefined;
	const toBool = (value: unknown): boolean | undefined =>
		typeof value === "boolean" ? value : undefined;
	const toOptionalNumberArray = (value: unknown): number[] | undefined =>
		Array.isArray(value) ? toNumberArray(value) : undefined;
	const toOptionalStringArray = (value: unknown): string[] | undefined =>
		Array.isArray(value) ? toStringArray(value) : undefined;
	const toFundingSources = (
		value: unknown,
	): InstitutionForm["funding_sources"] | undefined => {
		if (!Array.isArray(value)) return undefined;
		const items = value
			.map((item) => {
				if (!item || typeof item !== "object") return null;
				const source = item as Record<string, unknown>;
				const source_name = toString(source.source_name)?.trim();
				const description = toString(source.description)?.trim();
				if (!source_name) return null;
				return {
					source_name,
					description: description || null,
				};
			})
			.filter(
				(item): item is { source_name: string; description: string | null } =>
					item !== null,
			);
		return items;
	};

	const fallbackFundingSourceName = toString(data.funding_source_name)?.trim();
	const fallbackFundingSourceDescription = toString(
		data.funding_source_description,
	)?.trim();
	const funding_sources =
		toFundingSources(data.funding_sources) ??
		(fallbackFundingSourceName
			? [
					{
						source_name: fallbackFundingSourceName,
						description: fallbackFundingSourceDescription || null,
					},
				]
			: undefined);

	return {
		name: toString(data.name) ?? "",
		website: toString(data.website),
		phone: toString(data.phone),
		email: toString(data.email),
		area: toNumber(data.area),
		number_of_rooms: toNumber(data.number_of_rooms),
		parent_organization: toString(data.parent_organization),
		legal_form: toString(data.legal_form),
		capacity: toNumber(data.capacity),
		owner_name: toString(data.owner_name),
		owner_type: (data.owner_type as OwnerType | undefined) || undefined,
		rental_contract_type:
			(data.rental_contract_type as RentalContractType | undefined) ||
			undefined,
		rental_contract_end: toDateInput(data.rental_contract_end),
		funding_type: (data.funding_type as FundingType | undefined) || undefined,
		funding_sources,
		utilization_status:
			(data.utilization_status as UtilizationStatus | undefined) || undefined,
		utilization_status_info: toString(data.utilization_status_info),
		protection_status:
			(data.protection_status as ProtectionStatus | undefined) || undefined,
		protection_status_info: toString(data.protection_status_info),
		shared_use_allowed: toBool(data.shared_use_allowed),
		shared_use_info: toString(data.shared_use_info),
		shared_use_equipment: toString(data.shared_use_equipment),
		shared_use_audience: toString(data.shared_use_audience),
		shared_use_availability: toString(data.shared_use_availability),
		accessibility: toString(data.accessibility),
		cost: toString(data.cost),
		established_since: toDateInput(data.established_since),
		established_until: toDateInput(data.established_until),
		closing_reason: toString(data.closing_reason),
		notes: toString(data.notes),
		internal_notes: toString(data.internal_notes),
		status: (data.status as InstitutionStatus | undefined) || undefined,
		import_identifier: toString(data.import_identifier),
		source: toString(data.source),
		shared_use_contact_person: toString(data.shared_use_contact_person),
		contact_person_first_name: toString(data.contact_person_first_name),
		contact_person_last_name: toString(data.contact_person_last_name),
		contact_person_email: toString(data.contact_person_email),
		contact_person_phone: toString(data.contact_person_phone),
		contact_person_id: toNumber(data.contact_person_id),
		address: address ?? null,
		categoryIds: toOptionalNumberArray(data.categoryIds),
		tagIds: toOptionalNumberArray(data.tagIds),
		userIds: toOptionalStringArray(data.userIds),
		groupIds: toOptionalNumberArray(data.groupIds),
	};
};
