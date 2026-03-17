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
import {
	validateInstitutionCreateInput,
	validateInstitutionUpdateInput,
} from "@/server/validation/institutions";
import { assertPositiveInteger } from "@/server/validation/common";

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
	const validatedId = assertPositiveInteger(id, "Institution id must be positive.");
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");
	const baseWhere = { id: validatedId };
	return institutionRepo.findFirstWithInclude(baseWhere);
}

const buildInstitutionFieldList = (
	input: InstitutionForm | InstitutionUpdateForm,
) => {
	return { fields: buildInstitutionPermissionFields(input) };
};

export async function createInstitution(input: InstitutionForm) {
	const validatedInput = validateInstitutionCreateInput(input);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const { fields } = buildInstitutionFieldList(validatedInput);
	authorizeTable(ctx, "institution", "create");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "create");
	}

	const institution = await institutionRepo.create(
		buildInstitutionCreateData(validatedInput, currentUserId),
	);
	revalidateAccount();
	return institution;
}

export async function updateInstitution(input: InstitutionUpdateForm) {
	const validatedInput = validateInstitutionUpdateInput(input);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	const { fields } = buildInstitutionFieldList(validatedInput);
	authorizeTable(ctx, "institution", "update");
	const scope = getTableScope(ctx, "institution", "update");
	if (fields.length > 0) {
		authorizeFields(ctx, "institution", fields, "update");
	}

	const data = buildInstitutionUpdateData(validatedInput, currentUserId);

	if (scope === "all") {
		const institution = await institutionRepo.update(validatedInput.id, data);
		revalidateAccount();
		return institution;
	}

	const accessWhere = buildInstitutionScopedWhere(scope, currentUserId, {
		id: validatedInput.id,
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
	const validatedId = assertPositiveInteger(id, "Institution id must be positive.");
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "delete");
	const scope = getTableScope(ctx, "institution", "delete");
	if (scope === "all") {
		await institutionRepo.remove(validatedId);
		revalidateAccount();
		return { id: validatedId };
	}
	const accessWhere = buildInstitutionScopedWhere(scope, currentUserId, {
		id: validatedId,
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
	return { id: validatedId };
}

export async function searchInstitutions(query: string) {
	const normalizedQuery = query.trim();
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");

	if (normalizedQuery.length === 0) {
		return [];
	}

	const searchWhere = buildInstitutionSearchWhere(normalizedQuery);
	if (!searchWhere) return [];

	const select = buildInstitutionSelect(ctx);
	if (!select) return [];
	const where: Prisma.InstitutionWhereInput = {
		AND: [searchWhere, { status: { in: ["public", "private", "archived"] } }],
	};
	return institutionRepo.searchWithSelect(where, select);
}
