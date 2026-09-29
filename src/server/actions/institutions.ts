"use server";
import {
	actionError,
	actionOk,
	getActionErrorCode,
	type ActionResult,
} from "@/lib/actions/actionResult";
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
import {
	buildVisibleInstitutionWhere,
	loadInstitutionVisibility,
} from "@/server/logic/institutionVisibility";
import { buildInstitutionCreateData } from "@/server/logic/institutionCreateData";
import { buildInstitutionUpdateData } from "@/server/logic/institutionUpdateData";
import { withNewTagsResolved } from "@/server/logic/institutionTags";
import { buildInstitutionPermissionFields } from "@/lib/utils/institutionPermissionUtils";
import { revalidateAccount } from "../utils/actionsUtils";
import {
	validateInstitutionCreateInput,
	validateInstitutionUpdateInput,
} from "@/server/validation/institutions";
import { assertPositiveInteger } from "@/server/validation/common";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "@/server/logging/logger";

export type InstitutionActionErrorCode =
	| "notFound"
	| "forbidden"
	| "invalidInput"
	| "unexpected";

const classifyInstitutionActionError = (
	error: unknown,
): InstitutionActionErrorCode => {
	const errorCode = getActionErrorCode(error);
	if (errorCode === "P2025") return "notFound";
	if (error instanceof Error) {
		if (error.name === "RBACError") return "forbidden";
		if (error.name === "ZodError") return "invalidInput";
	}
	return "unexpected";
};

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
	const validatedId = assertPositiveInteger(
		id,
		"Institution id must be positive.",
	);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "institution", "read");
	const select = buildInstitutionSelect(ctx);
	if (!select) return null;
	const scope = getTableScope(ctx, "institution", "read");
	const where = buildInstitutionScopedWhere(scope, currentUserId, {
		id: validatedId,
	});
	if (!where) return null;
	return institutionRepo.findFirstWithSelect(where, select);
}

const buildInstitutionFieldList = (
	input: InstitutionForm | InstitutionUpdateForm,
) => {
	return { fields: buildInstitutionPermissionFields(input) };
};

export async function createInstitution(
	input: InstitutionForm,
): Promise<
	ActionResult<
		Awaited<ReturnType<typeof institutionRepo.create>>,
		InstitutionActionErrorCode
	>
> {
	return runWithServerRequestContext(
		async () => {
			let validatedInput: InstitutionForm;
			try {
				validatedInput = validateInstitutionCreateInput(input);
			} catch (error) {
				return actionError(classifyInstitutionActionError(error));
			}
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			const { fields } = buildInstitutionFieldList(validatedInput);
			authorizeTable(ctx, "institution", "create");
			if (fields.length > 0) {
				authorizeFields(ctx, "institution", fields, "create");
			}

			let institution;
			try {
				institution = await institutionRepo.create(
					buildInstitutionCreateData(
						await withNewTagsResolved(validatedInput),
						currentUserId,
					),
				);
			} catch (error) {
				logger.error("institution.create.db_failed", error, {
					subsystem: "institution",
					db_subsystem: "db",
					actor_user_id: currentUserId,
				});
				return actionError(classifyInstitutionActionError(error));
			}
			revalidateAccount();
			return actionOk(institution);
		},
		{ route: "server_action:institutions.createInstitution" },
	);
}

export async function updateInstitution(
	input: InstitutionUpdateForm,
): Promise<
	ActionResult<
		Awaited<ReturnType<typeof institutionRepo.update>>,
		InstitutionActionErrorCode
	>
> {
	return runWithServerRequestContext(
		async () => {
			let validatedInput: InstitutionUpdateForm;
			try {
				validatedInput = validateInstitutionUpdateInput(input);
			} catch (error) {
				return actionError(classifyInstitutionActionError(error));
			}
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			const { fields } = buildInstitutionFieldList(validatedInput);
			authorizeTable(ctx, "institution", "update");
			const scope = getTableScope(ctx, "institution", "update");
			if (fields.length > 0) {
				authorizeFields(ctx, "institution", fields, "update");
			}

			// New tags are only created once every permission check has passed.
			const buildData = async () =>
				buildInstitutionUpdateData(
					await withNewTagsResolved(validatedInput),
					currentUserId,
				);

			if (scope === "all") {
				let institution;
				try {
					institution = await institutionRepo.update(
						validatedInput.id,
						await buildData(),
					);
				} catch (error) {
					logger.error("institution.update.db_failed", error, {
						subsystem: "institution",
						db_subsystem: "db",
						actor_user_id: currentUserId,
						institution_id: validatedInput.id,
					});
					return actionError(classifyInstitutionActionError(error));
				}
				revalidateAccount();
				return actionOk(institution);
			}

			const accessWhere = buildInstitutionScopedWhere(scope, currentUserId, {
				id: validatedInput.id,
			});
			if (!accessWhere) {
				return actionError("forbidden");
			}
			const authorizedInstitution =
				await institutionRepo.findFirstWithInclude(accessWhere);
			if (!authorizedInstitution) {
				return actionError("forbidden");
			}
			let institution;
			try {
				institution = await institutionRepo.update(
					authorizedInstitution.id,
					await buildData(),
				);
			} catch (error) {
				logger.error("institution.update.db_failed", error, {
					subsystem: "institution",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					institution_id: authorizedInstitution.id,
				});
				return actionError(classifyInstitutionActionError(error));
			}
			revalidateAccount();
			return actionOk(institution);
		},
		{ route: "server_action:institutions.updateInstitution" },
	);
}

export async function deleteInstitution(
	id: number,
): Promise<ActionResult<{ id: number }, InstitutionActionErrorCode>> {
	return runWithServerRequestContext(
		async () => {
			let validatedId: number;
			try {
				validatedId = assertPositiveInteger(
					id,
					"Institution id must be positive.",
				);
			} catch (error) {
				return actionError(classifyInstitutionActionError(error));
			}
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "institution", "delete");
			const scope = getTableScope(ctx, "institution", "delete");
			if (scope === "all") {
				try {
					await institutionRepo.remove(validatedId);
				} catch (error) {
					logger.error("institution.delete.db_failed", error, {
						subsystem: "institution",
						db_subsystem: "db",
						actor_user_id: currentUserId,
						institution_id: validatedId,
					});
					return actionError(classifyInstitutionActionError(error));
				}
				revalidateAccount();
				return actionOk({ id: validatedId });
			}
			const accessWhere = buildInstitutionScopedWhere(scope, currentUserId, {
				id: validatedId,
			});
			if (!accessWhere) {
				return actionError("forbidden");
			}
			const authorizedInstitution =
				await institutionRepo.findFirstWithInclude(accessWhere);
			if (!authorizedInstitution) {
				return actionError("forbidden");
			}
			try {
				await institutionRepo.remove(authorizedInstitution.id);
			} catch (error) {
				logger.error("institution.delete.db_failed", error, {
					subsystem: "institution",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					institution_id: authorizedInstitution.id,
				});
				return actionError(classifyInstitutionActionError(error));
			}
			revalidateAccount();
			return actionOk({ id: validatedId });
		},
		{ route: "server_action:institutions.deleteInstitution" },
	);
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

	const visibility = await loadInstitutionVisibility(ctx, currentUserId);
	const select = visibility.select;
	if (!select) return [];
	const where = buildVisibleInstitutionWhere(
		visibility.scope,
		currentUserId,
		searchWhere,
	);
	if (!where) return [];
	const institutions = await institutionRepo.searchWithSelect(where, select);
	return visibility.redactInstitutions(institutions);
}
