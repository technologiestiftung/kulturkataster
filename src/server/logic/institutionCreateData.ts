import type { Prisma } from "@/generated/prisma";
import type { InstitutionForm } from "@/types";
import { normalizeFundingSources } from "@/lib/utils/formUtils";
import { buildCreateContactPersonRelation } from "./institutionContactPersonData";

const buildAddressCreate = (address?: InstitutionForm["address"] | null) => {
	if (!address) return undefined;
	const { id, ...data } = address;
	if (id) {
		return { connect: { id } };
	}
	return { create: data };
};

export const buildInstitutionCreateData = (
	input: InstitutionForm,
	currentUserId: string | null,
): Prisma.InstitutionCreateInput => ({
	name: input.name,
	website: input.website ?? null,
	phone: input.phone ?? null,
	email: input.email ?? null,
	area: input.area ?? null,
	number_of_rooms: input.number_of_rooms ?? null,
	parent_organization: input.parent_organization ?? null,
	legal_form: input.legal_form ?? null,
	capacity: input.capacity ?? null,
	culture_index: input.culture_index ?? null,
	owner_name: input.owner_name ?? null,
	owner_type: input.owner_type ?? undefined,
	rental_contract_type: input.rental_contract_type ?? undefined,
	rental_contract_end: input.rental_contract_end ?? null,
	funding_type: input.funding_type ?? undefined,
	funding_sources:
		input.funding_sources !== undefined
			? {
					create: normalizeFundingSources(input.funding_sources).map(
						(source) => ({
							source_name: source.source_name,
							description: source.description,
						}),
					),
				}
			: undefined,
	utilization_status: input.utilization_status ?? undefined,
	utilization_status_info: input.utilization_status_info ?? null,
	utilization_status_internal_notes:
		input.utilization_status_internal_notes ?? null,
	protection_status: input.protection_status ?? undefined,
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
	status: input.status ?? "public",
	import_identifier: input.import_identifier ?? null,
	source: input.source ?? null,
	shared_use_contact_person: input.shared_use_contact_person ?? null,
	creator: { connect: { id: currentUserId! } },
	updater: currentUserId ? { connect: { id: currentUserId } } : undefined,
	address: buildAddressCreate(input.address),
	contact_person: buildCreateContactPersonRelation(input),
	categories: input.categoryIds
		? { connect: input.categoryIds.map((id) => ({ id })) }
		: undefined,
	tags: input.tagIds
		? { connect: input.tagIds.map((id) => ({ id })) }
		: undefined,
	users: input.userIds
		? { connect: input.userIds.map((id) => ({ id })) }
		: undefined,
	groups: input.groupIds
		? { connect: input.groupIds.map((id) => ({ id })) }
		: undefined,
});
