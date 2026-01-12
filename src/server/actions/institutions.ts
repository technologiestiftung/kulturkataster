"use server";

import type { InstitutionForm, InstitutionUpdateForm } from "@/types";
import {
	authorizeFields,
	authorizeTable,
	getAccessContextForUser,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { institutionRepo } from "@/server/data/institutionRepo";
import { buildInstitutionSearchWhere } from "@/server/logic/institutionSearch";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";

export async function getInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	return institutionRepo.listWithSelect(select);
}

export async function getMyInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	if (!currentUserId) {
		return [];
	}

	return institutionRepo.listForUser(currentUserId);
}

const buildInstitutionFieldList = (
	input: InstitutionForm | InstitutionUpdateForm,
) => {
	const fields = Object.keys(input).filter(
		(key) =>
			![
				"id",
				"categoryIds",
				"tagIds",
				"userIds",
				"groupIds",
				"address",
			].includes(key),
	);
	const addressFields = input.address
		? Object.keys(input.address)
				.filter((field) => field !== "id")
				.map((field) => `address.${field}`)
		: [];
	return { fields, addressFields };
};

const buildAddressCreate = (address?: InstitutionForm["address"] | null) => {
	if (!address) return undefined;
	const { id, ...data } = address;
	if (id) {
		return { connect: { id } };
	}
	return { create: data };
};

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

export async function createInstitution(input: InstitutionForm) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const { fields, addressFields } = buildInstitutionFieldList(input);
	authorizeTable(ctx, "institution", "update");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "update");
	}
	if (addressFields.length > 0) {
		authorizeFields(ctx, "institution", addressFields, "update");
	}
	if (input.address && !input.address.id && !input.address.street) {
		throw new Error("Address street is required when creating a new address.");
	}

	return institutionRepo.create({
		name: input.name,
		website: input.website ?? null,
		phone: input.phone ?? null,
		email: input.email ?? null,
		area: input.area ?? null,
		number_of_rooms: input.number_of_rooms ?? null,
		parent_organization: input.parent_organization ?? null,
		legal_form: input.legal_form ?? null,
		capacity: input.capacity ?? null,
		owner_name: input.owner_name ?? null,
		owner_type: input.owner_type ?? undefined,
		rental_contract_type: input.rental_contract_type ?? undefined,
		rental_contract_end: input.rental_contract_end ?? null,
		funding_type: input.funding_type ?? undefined,
		utilization_status: input.utilization_status ?? undefined,
		utilization_status_info: input.utilization_status_info ?? null,
		protection_status: input.protection_status ?? undefined,
		protection_status_info: input.protection_status_info ?? null,
		shared_use_allowed: input.shared_use_allowed ?? false,
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
		shared_use_contact_person_id: input.shared_use_contact_person_id ?? null,
		creator: { connect: { id: currentUserId! } },
		updater: currentUserId ? { connect: { id: currentUserId } } : undefined,
		address: buildAddressCreate(input.address),
		contact_person: buildContactPersonConnect(input.contact_person_id),
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
}

export async function updateInstitution(input: InstitutionUpdateForm) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const { fields, addressFields } = buildInstitutionFieldList(input);
	authorizeTable(ctx, "institution", "update");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "update");
	}
	if (addressFields.length > 0) {
		authorizeFields(ctx, "institution", addressFields, "update");
	}

	return institutionRepo.update(input.id, {
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
		utilization_status: input.utilization_status ?? undefined,
		utilization_status_info: input.utilization_status_info ?? undefined,
		protection_status: input.protection_status ?? undefined,
		protection_status_info: input.protection_status_info ?? undefined,
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
		shared_use_contact_person_id:
			input.shared_use_contact_person_id ?? undefined,
		updater: currentUserId ? { connect: { id: currentUserId } } : undefined,
		address: buildAddressUpsert(input.address),
		contact_person: buildContactPersonConnect(input.contact_person_id),
		categories: input.categoryIds
			? { set: input.categoryIds.map((id) => ({ id })) }
			: undefined,
		tags: input.tagIds
			? { set: input.tagIds.map((id) => ({ id })) }
			: undefined,
		users: input.userIds
			? { set: input.userIds.map((id) => ({ id })) }
			: undefined,
		groups: input.groupIds
			? { set: input.groupIds.map((id) => ({ id })) }
			: undefined,
	});
}

export async function deleteInstitution(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "delete");
	return institutionRepo.remove(id);
}

export async function searchInstitutions(query: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	if (!query || query.trim().length === 0) {
		return [];
	}

	const where = buildInstitutionSearchWhere(query);
	if (!where) return [];

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	return institutionRepo.searchWithSelect(where, select);
}
