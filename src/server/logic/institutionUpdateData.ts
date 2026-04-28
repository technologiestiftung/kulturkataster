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

export const buildInstitutionUpdateData = (
	input: InstitutionUpdateForm,
	currentUserId: string | null,
): InstitutionUpdateInput => ({
	name: input.name,
	website: input.website ?? null,
	phone: input.phone ?? null,
	email: input.email ?? null,
	area: input.area ?? undefined,
	number_of_rooms: input.number_of_rooms ?? undefined,
	parent_organization: input.parent_organization ?? null,
	legal_form: input.legal_form ?? null,
	capacity: input.capacity ?? undefined,
	owner_name: input.owner_name ?? null,
	owner_type: input.owner_type ?? null,
	rental_contract_type: input.rental_contract_type ?? null,
	rental_contract_end: input.rental_contract_end ?? null,
	funding_type: input.funding_type ?? null,
	funding_sources: buildFundingSourcesUpdate(input.funding_sources),
	utilization_status: input.utilization_status ?? null,
	utilization_status_info: input.utilization_status_info ?? null,
	utilization_status_internal_notes:
		input.utilization_status_internal_notes ?? null,
	protection_status: input.protection_status ?? null,
	protection_status_info: input.protection_status_info ?? null,
	protection_status_internal_notes:
		input.protection_status_internal_notes ?? null,
	shared_use_allowed: input.shared_use_allowed ?? null,
	shared_use_info: input.shared_use_info ?? null,
	shared_use_equipment: input.shared_use_equipment ?? null,
	shared_use_audience: input.shared_use_audience ?? null,
	shared_use_availability: input.shared_use_availability ?? null,
	accessibility: input.accessibility ?? null,
	cost: input.cost ?? null,
	established_since: input.established_since ?? null,
	established_until: input.established_until ?? null,
	closing_reason: input.closing_reason ?? null,
	notes: input.notes ?? null,
	internal_notes: input.internal_notes ?? null,
	status: input.status ?? undefined,
	import_identifier: input.import_identifier ?? null,
	source: input.source ?? null,
	shared_use_contact_person: input.shared_use_contact_person ?? null,
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
