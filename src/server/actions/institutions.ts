"use server";

import type { InstitutionForm, InstitutionUpdateForm } from "@/types";
import {
	authorizeFields,
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { institutionRepo } from "@/server/data/institutionRepo";
import { buildInstitutionSearchWhere } from "@/server/logic/institutionSearch";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { buildInstitutionPermissionFields } from "@/lib/utils/institutionPermissionUtils";
import { revalidateAccount } from "../utils/actionsUtils";

export async function getInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");
	const scope = getTableScope(ctx, "institution", "read");

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	const where = buildInstitutionScopedWhere(scope, currentUserId);
	if (!where && scope !== "all") return [];
	return where
		? institutionRepo.listWithSelectWhere(where, select)
		: institutionRepo.listWithSelect(select);
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

export async function getInstitutionById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");
	const baseWhere = { id };
	return institutionRepo.findFirstWithInclude(baseWhere);
}

const buildInstitutionFieldList = (
	input: InstitutionForm | InstitutionUpdateForm,
) => {
	return { fields: buildInstitutionPermissionFields(input) };
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
	const { fields } = buildInstitutionFieldList(input);
	authorizeTable(ctx, "institution", "create");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "create");
	}
	if (input.address && !input.address.id && !input.address.street) {
		throw new Error("Address street is required when creating a new address.");
	}

	const institution = await institutionRepo.create({
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
		shared_use_contact_person: input.shared_use_contact_person ?? null,
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
	revalidateAccount();
	return institution;
}

export async function updateInstitution(input: InstitutionUpdateForm) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const { fields } = buildInstitutionFieldList(input);
	authorizeTable(ctx, "institution", "update");
	const scope = getTableScope(ctx, "institution", "update");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "update");
	}

	const data = {
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
		shared_use_contact_person: input.shared_use_contact_person ?? undefined,
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
	};

	if (scope === "all") {
		const institution = await institutionRepo.update(input.id, data);
		revalidateAccount();
		return institution;
	}

	const accessWhere = buildInstitutionScopedWhere(scope, currentUserId, {
		id: input.id,
	});
	if (!accessWhere) {
		throw new Error("User must be authenticated to update institutions.");
	}
	const result = await institutionRepo.updateWhere(accessWhere, data);
	if (result.count === 0) {
		throw new Error("Not authorized to update this institution.");
	}
	const institution = await institutionRepo.findFirstWithInclude(accessWhere);
	revalidateAccount();
	return institution;
}

export async function deleteInstitution(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "delete");
	const scope = getTableScope(ctx, "institution", "delete");
	if (scope === "all") {
		await institutionRepo.remove(id);
		revalidateAccount();
		return { id };
	}
	const accessWhere = buildInstitutionScopedWhere(scope, currentUserId, {
		id,
	});
	if (!accessWhere) {
		throw new Error("User must be authenticated to delete institutions.");
	}
	const result = await institutionRepo.removeWhere(accessWhere);
	if (result.count === 0) {
		throw new Error("Not authorized to delete this institution.");
	}
	revalidateAccount();
	return { id };
}

export async function searchInstitutions(query: string) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");
	const scope = getTableScope(ctx, "institution", "read");

	if (!query || query.trim().length === 0) {
		return [];
	}

	const where = buildInstitutionSearchWhere(query);
	if (!where) return [];

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	const scopedWhere = buildInstitutionScopedWhere(scope, currentUserId, where);
	if (!scopedWhere && scope !== "all") return [];
	return scopedWhere
		? institutionRepo.searchWithSelect(scopedWhere, select)
		: institutionRepo.searchWithSelect(where, select);
}
