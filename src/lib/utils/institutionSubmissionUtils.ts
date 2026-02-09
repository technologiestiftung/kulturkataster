import type { Submission } from "@/types/submission";
import type { InstitutionForm } from "@/types/institution";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
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
	const toNumberArray = (value: unknown): number[] | undefined =>
		Array.isArray(value)
			? value
					.map((item) => Number(item))
					.filter((item) => Number.isFinite(item))
			: undefined;
	const toStringArray = (value: unknown): string[] | undefined =>
		Array.isArray(value) ? value.map((item) => String(item)) : undefined;
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
				(
					item,
				): item is { source_name: string; description: string | null } =>
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
		owner_type: data.owner_type as OwnerType | undefined,
		rental_contract_type: data.rental_contract_type as RentalContractType,
		rental_contract_end: toString(data.rental_contract_end),
		funding_type: data.funding_type as FundingType | undefined,
		funding_sources,
		utilization_status: data.utilization_status as
			| UtilizationStatus
			| undefined,
		utilization_status_info: toString(data.utilization_status_info),
		protection_status: data.protection_status as ProtectionStatus | undefined,
		protection_status_info: toString(data.protection_status_info),
		shared_use_allowed: toBool(data.shared_use_allowed),
		shared_use_info: toString(data.shared_use_info),
		shared_use_equipment: toString(data.shared_use_equipment),
		shared_use_audience: toString(data.shared_use_audience),
		shared_use_availability: toString(data.shared_use_availability),
		accessibility: toString(data.accessibility),
		cost: toString(data.cost),
		established_since: toString(data.established_since),
		established_until: toString(data.established_until),
		closing_reason: toString(data.closing_reason),
		notes: toString(data.notes),
		internal_notes: toString(data.internal_notes),
		status: data.status as InstitutionStatus | undefined,
		import_identifier: toString(data.import_identifier),
		source: toString(data.source),
		shared_use_contact_person: toString(data.shared_use_contact_person),
		contact_person_id: toNumber(data.contact_person_id),
		address: address ?? null,
		categoryIds: toNumberArray(data.categoryIds),
		tagIds: toNumberArray(data.tagIds),
		userIds: toStringArray(data.userIds),
		groupIds: toNumberArray(data.groupIds),
	};
};
