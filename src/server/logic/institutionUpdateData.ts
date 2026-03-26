import type { Prisma } from "@/generated/prisma";
import type {
	InstitutionForm,
	InstitutionUpdateForm,
	InstitutionUpdateInput,
} from "@/types";
import { normalizeFundingSources } from "@/lib/utils/formUtils";

const buildAddressUpsert = (address?: InstitutionForm["address"] | null) => {
	if (!address) return undefined;
	const { id, ...data } = address;
	if (id) {
		return { update: data, create: data };
	}
	return { create: data };
};

const buildContactPersonConnect = (contactPersonId?: number | null) => {
	if (typeof contactPersonId === "undefined") return undefined;
	if (contactPersonId === null) {
		return { disconnect: true };
	}
	return { connect: { id: contactPersonId } };
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
	website: input.website ?? undefined,
	phone: input.phone ?? undefined,
	email: input.email ?? undefined,
	area: input.area ?? undefined,
	number_of_rooms: input.number_of_rooms ?? undefined,
	parent_organization: input.parent_organization ?? undefined,
	legal_form: input.legal_form ?? undefined,
	capacity: input.capacity ?? undefined,
	owner_name: input.owner_name ?? undefined,
	owner_type: input.owner_type ?? undefined,
	rental_contract_type: input.rental_contract_type ?? undefined,
	rental_contract_end: input.rental_contract_end ?? undefined,
	funding_type: input.funding_type ?? undefined,
	funding_sources: buildFundingSourcesUpdate(input.funding_sources),
	utilization_status: input.utilization_status ?? undefined,
	utilization_status_info: input.utilization_status_info ?? undefined,
	utilization_status_internal_notes:
		input.utilization_status_internal_notes ?? null,
	protection_status: input.protection_status ?? undefined,
	protection_status_info: input.protection_status_info ?? undefined,
	protection_status_internal_notes:
		input.protection_status_internal_notes ?? null,
	shared_use_allowed: input.shared_use_allowed ?? undefined,
	shared_use_info: input.shared_use_info ?? undefined,
	shared_use_equipment: input.shared_use_equipment ?? undefined,
	shared_use_audience: input.shared_use_audience ?? undefined,
	shared_use_availability: input.shared_use_availability ?? undefined,
	accessibility: input.accessibility ?? undefined,
	cost: input.cost ?? undefined,
	established_since: input.established_since ?? undefined,
	established_until: input.established_until ?? undefined,
	closing_reason: input.closing_reason ?? undefined,
	notes: input.notes ?? undefined,
	internal_notes: input.internal_notes ?? undefined,
	status: input.status ?? undefined,
	import_identifier: input.import_identifier ?? undefined,
	source: input.source ?? undefined,
	shared_use_contact_person: input.shared_use_contact_person ?? undefined,
	updater: currentUserId ? { connect: { id: currentUserId } } : undefined,
	address: buildAddressUpsert(input.address),
	contact_person: buildContactPersonConnect(input.contact_person_id),
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
