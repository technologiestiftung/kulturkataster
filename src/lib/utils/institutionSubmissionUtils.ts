import type { Submission } from "@/types/submission";
import type { InstitutionForm } from "@/types/institution";
import {
	buildAddressFromFormData,
	normalizeFundingSources,
	toDate,
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
import {
	isRecord,
	normalizeInstitutionRelationFields,
} from "@/lib/utils/institutionRelationFields";

type SubmissionLike =
	| Submission
	| { data?: Record<string, unknown> | undefined };

export const institutionSubmissionToDraft = (
	submission: SubmissionLike,
): InstitutionForm => {
	const data = normalizeInstitutionRelationFields(
		(submission.data ?? {}) as Record<string, unknown>,
	);
	const address =
		typeof data.address === "object" && data.address
			? (data.address as InstitutionForm["address"])
			: buildAddressFromFormData(data);
	const contactPerson = isRecord(data.contact_person)
		? data.contact_person
		: {};

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
	const funding_sources = normalizeFundingSources(data.funding_sources, {
		source_name: data.funding_source_name,
		description: data.funding_source_description,
	});

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
		rental_contract_end: toDate(data.rental_contract_end) ?? undefined,
		funding_type: (data.funding_type as FundingType | undefined) || undefined,
		funding_sources: funding_sources.length > 0 ? funding_sources : undefined,
		utilization_status:
			(data.utilization_status as UtilizationStatus | undefined) || undefined,
		utilization_status_info: toString(data.utilization_status_info),
		utilization_status_internal_notes: toString(
			data.utilization_status_internal_notes,
		),
		protection_status:
			(data.protection_status as ProtectionStatus | undefined) || undefined,
		protection_status_info: toString(data.protection_status_info),
		protection_status_internal_notes: toString(
			data.protection_status_internal_notes,
		),
		shared_use_allowed: toBool(data.shared_use_allowed),
		shared_use_info: toString(data.shared_use_info),
		shared_use_equipment: toString(data.shared_use_equipment),
		shared_use_audience: toString(data.shared_use_audience),
		shared_use_availability: toString(data.shared_use_availability),
		accessibility: toString(data.accessibility),
		cost: toString(data.cost),
		established_since: toDate(data.established_since) ?? undefined,
		established_until: toDate(data.established_until) ?? undefined,
		closing_reason: toString(data.closing_reason),
		notes: toString(data.notes),
		internal_notes: toString(data.internal_notes),
		status: (data.status as InstitutionStatus | undefined) || undefined,
		import_identifier: toString(data.import_identifier),
		source: toString(data.source),
		shared_use_contact_person: toString(data.shared_use_contact_person),
		contact_person_first_name: toString(contactPerson.first_name),
		contact_person_last_name: toString(contactPerson.last_name),
		contact_person_email: toString(contactPerson.email),
		contact_person_phone: toString(contactPerson.phone),
		contact_person_id:
			toNumber(data.contact_person_id) ?? toNumber(contactPerson.id),
		address: address ?? null,
		categoryIds: toOptionalNumberArray(data.categoryIds),
		tagIds: toOptionalNumberArray(data.tagIds),
		userIds: toOptionalStringArray(data.userIds),
		groupIds: toOptionalNumberArray(data.groupIds),
	};
};
