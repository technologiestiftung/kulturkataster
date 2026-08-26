import type { Prisma } from "@/generated/prisma";
import type {
	InstitutionForm,
	InstitutionUpdateForm,
	InstitutionUpdateInput,
} from "@/types";
import { normalizeFundingSources } from "@/lib/utils/formUtils";
import { buildUpdateContactPersonRelation } from "./institutionContactPersonData";

const buildAddressUpsert = (address?: InstitutionForm["address"] | null) => {
	if (!address) return undefined;
	const { id, ...data } = address;
	if (id) {
		return { update: data, create: data };
	}
	return { create: data };
};

const buildFundingSourcesUpdate = (
	fundingSources?: InstitutionForm["funding_sources"] | null,
): Prisma.FundingSourceUpdateManyWithoutInstitutionNestedInput | undefined => {
	if (typeof fundingSources === "undefined") return undefined;
	const normalized = normalizeFundingSources(fundingSources);
	const existing = normalized
		.filter((source) => typeof source.id === "number")
		.map((source) => ({
			id: source.id as number,
			source_name: source.source_name,
			description: source.description,
		}));
	const newSources = normalized.filter(
		(source) => typeof source.id !== "number",
	);
	const existingIds = existing.map((source) => source.id);

	return {
		deleteMany: existingIds.length > 0 ? { id: { notIn: existingIds } } : {},
		upsert: existing.map((source) => ({
			where: { id: source.id },
			update: {
				source_name: source.source_name,
				description: source.description,
			},
			create: {
				source_name: source.source_name,
				description: source.description,
			},
		})),
		create: newSources.map((source) => ({
			source_name: source.source_name,
			description: source.description,
		})),
	};
};

const preserveNullableNumberUpdate = (
	value: number | null | undefined,
): number | null | undefined => {
	if (value === undefined) return undefined;
	return value;
};

const preserveNullableUpdate = <T>(value: T | null | undefined) => {
	if (typeof value === "undefined") return undefined;
	return value ?? null;
};

export const buildInstitutionUpdateData = (
	input: InstitutionUpdateForm,
	currentUserId: string | null,
): InstitutionUpdateInput => ({
	name: input.name,
	website: preserveNullableUpdate(input.website),
	phone: preserveNullableUpdate(input.phone),
	email: preserveNullableUpdate(input.email),
	area: preserveNullableNumberUpdate(input.area),
	number_of_rooms: preserveNullableNumberUpdate(input.number_of_rooms),
	parent_organization: preserveNullableUpdate(input.parent_organization),
	legal_form: preserveNullableUpdate(input.legal_form),
	capacity: preserveNullableNumberUpdate(input.capacity),
	culture_index: preserveNullableNumberUpdate(input.culture_index),
	owner_name: preserveNullableUpdate(input.owner_name),
	owner_type: preserveNullableUpdate(input.owner_type),
	rental_contract_type: preserveNullableUpdate(input.rental_contract_type),
	rental_contract_end: preserveNullableUpdate(input.rental_contract_end),
	funding_type: preserveNullableUpdate(input.funding_type),
	funding_sources: buildFundingSourcesUpdate(input.funding_sources),
	utilization_status: preserveNullableUpdate(input.utilization_status),
	utilization_status_info: preserveNullableUpdate(
		input.utilization_status_info,
	),
	utilization_status_internal_notes: preserveNullableUpdate(
		input.utilization_status_internal_notes,
	),
	protection_status: preserveNullableUpdate(input.protection_status),
	protection_status_info: preserveNullableUpdate(input.protection_status_info),
	protection_status_internal_notes: preserveNullableUpdate(
		input.protection_status_internal_notes,
	),
	shared_use_allowed: preserveNullableUpdate(input.shared_use_allowed),
	shared_use_info: preserveNullableUpdate(input.shared_use_info),
	shared_use_equipment: preserveNullableUpdate(input.shared_use_equipment),
	shared_use_audience: preserveNullableUpdate(input.shared_use_audience),
	shared_use_availability: preserveNullableUpdate(
		input.shared_use_availability,
	),
	accessibility: preserveNullableUpdate(input.accessibility),
	cost: preserveNullableUpdate(input.cost),
	established_since: preserveNullableUpdate(input.established_since),
	established_until: preserveNullableUpdate(input.established_until),
	closing_reason: preserveNullableUpdate(input.closing_reason),
	notes: preserveNullableUpdate(input.notes),
	internal_notes: preserveNullableUpdate(input.internal_notes),
	status: input.status ?? undefined,
	import_identifier: preserveNullableUpdate(input.import_identifier),
	source: preserveNullableUpdate(input.source),
	shared_use_contact_person: preserveNullableUpdate(
		input.shared_use_contact_person,
	),
	updater: currentUserId ? { connect: { id: currentUserId } } : undefined,
	address: buildAddressUpsert(input.address),
	contact_person: buildUpdateContactPersonRelation(input),
	categories: input.categoryIds
		? { set: input.categoryIds.map((id) => ({ id })) }
		: undefined,
	tags: input.tagIds ? { set: input.tagIds.map((id) => ({ id })) } : undefined,
	users: input.userIds
		? { set: input.userIds.map((id) => ({ id })) }
		: undefined,
	groups: input.groupIds
		? { set: input.groupIds.map((id) => ({ id })) }
		: undefined,
});
