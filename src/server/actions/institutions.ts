"use server";

import type { Prisma } from "@/generated/prisma";
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
import { buildInstitutionCreateData } from "@/server/logic/institutionCreateData";
import { buildInstitutionUpdateData } from "@/server/logic/institutionUpdateData";
import { buildInstitutionPermissionFields } from "@/lib/utils/institutionPermissionUtils";
import { revalidateAccount } from "../utils/actionsUtils";

export async function getInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	const where: Prisma.InstitutionWhereInput = {
		status: { in: ["public", "private", "archived"] },
	};
	return institutionRepo.listWithSelectWhere(where, select);
}

export async function getMyInstitutions() {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");
	const scope = getTableScope(ctx, "institution", "read");
	const select = buildInstitutionSelect(ctx);
	if (!select) return [];

	if (scope === "all") {
		return institutionRepo.listWithSelect(select);
	}

	if (!currentUserId) {
		return [];
	}

	const where = buildInstitutionScopedWhere(scope, currentUserId);
	if (!where) return [];
	return institutionRepo.listWithSelectWhere(where, select);
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

export async function createInstitution(input: InstitutionForm) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const { fields } = buildInstitutionFieldList(input);
	authorizeTable(ctx, "institution", "create");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "create");
	}

	const institution = await institutionRepo.create(
		buildInstitutionCreateData(input, currentUserId),
	);
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

	const data = buildInstitutionUpdateData(input, currentUserId);

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
	const authorizedInstitution =
		await institutionRepo.findFirstWithInclude(accessWhere);
	if (!authorizedInstitution) {
		throw new Error("Not authorized to update this institution.");
	}
	const institution = await institutionRepo.update(
		authorizedInstitution.id,
		data,
	);
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
	const authorizedInstitution =
		await institutionRepo.findFirstWithInclude(accessWhere);
	if (!authorizedInstitution) {
		throw new Error("Not authorized to delete this institution.");
	}
	await institutionRepo.remove(authorizedInstitution.id);
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
