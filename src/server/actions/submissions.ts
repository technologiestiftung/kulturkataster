"use server";

import { Prisma } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { buildInstitutionCreateData } from "@/server/logic/institutionCreateData";
import { submissionRepo } from "@/server/data/submissionRepo";
import { buildInstitutionUpdateData } from "@/server/logic/institutionUpdateData";
import { prisma } from "@/server/prisma";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import {
	authorizeTable,
	canFields,
	getAccessContextForUser,
	getTableScope,
	requireAllScope,
	requireScopeOrUser,
} from "@/server/utils/rbac";
import { revalidateAccount } from "@/server/utils/actionsUtils";
import { ClaimSubmissionDetail } from "@/types";
import {
	buildInstitutionPermissionFields,
	filterInstitutionInputByPermissionFields,
} from "@/lib/utils/institutionPermissionUtils";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { runWithAuditContext } from "@/server/utils/auditContext";
import type { AuditContext } from "@/server/utils/auditContext";
import {
	ClaimReviewPayload,
	SubmissionCreatePayload,
	SubmissionFilter,
	SubmissionReviewPayload,
	SubmissionUpdatePayload,
} from "@/types/submission";
import { updateSubmissionAuditStatus } from "@/server/logic/submissionAudit";
import {
	normalizeOptionalSubmissionJson,
	normalizeSubmissionJson,
} from "@/lib/utils/submissionJsonUtils";
import {
	sendClaimDecisionEmail,
	sendSubmissionDecisionEmail,
} from "@/server/email/dispatcher";
import {
	validateClaimReviewInput,
	validateSubmissionCreateInput,
	validateSubmissionId,
	validateSubmissionReviewInput,
	validateSubmissionUpdateInput,
} from "@/server/validation/submissions";

export async function getSubmissions(filter: SubmissionFilter = {}) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");
	const scope = getTableScope(ctx, "submission", "read");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	const where: Prisma.SubmissionWhereInput = {
		entity_type: filter.entityType,
		entity_id: filter.entityId ?? undefined,
		status: filter.status,
		type: filter.type,
		created_by: ownerId ? ownerId : (filter.createdBy ?? undefined),
		reviewed_by: filter.reviewedBy ?? undefined,
	};
	return submissionRepo.list(where);
}

export async function getClaimSubmissionsDetailed(
	userId?: string,
): Promise<ClaimSubmissionDetail[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");
	requireAllScope(ctx, "submission", "read");
	const submissions = await prisma.submission.findMany({
		where: { type: "claim", created_by: userId ?? undefined },
		orderBy: { created_at: "desc" },
		include: {
			creator: {
				include: {
					role: {
						include: {
							table_permissions: true,
						},
					},
					groups: true,
					institutions: true,
					submissions: true,
				},
			},
		},
	});

	const institutionIds = submissions
		.map((submission) => submission.entity_id)
		.filter((id): id is number => typeof id === "number");

	const institutions = institutionIds.length
		? await prisma.institution.findMany({
				where: { id: { in: institutionIds } },
				include: {
					address: true,
					users: true,
					groups: true,
					contact_person: true,
					categories: true,
					tags: true,
				},
			})
		: [];

	const institutionById = new Map(
		institutions.map((institution) => [institution.id, institution]),
	);

	return submissions.map((submission) => ({
		submission,
		institution:
			typeof submission.entity_id === "number"
				? (institutionById.get(submission.entity_id) ?? null)
				: null,
		claimant: submission.creator ?? null,
	}));
}

export async function getSubmissionById(id: number) {
	const validatedId = validateSubmissionId(id);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");
	const scope = getTableScope(ctx, "submission", "read");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		return submissionRepo.findById(validatedId);
	}
	return submissionRepo.findFirst({ id: validatedId, created_by: ownerId });
}

export async function createSubmission(input: SubmissionCreatePayload) {
	const validatedInput = validateSubmissionCreateInput(input);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "create");

	const nextStatus = "approval_pending";

	if (currentUserId && typeof validatedInput.entityId === "number") {
		const existingPending = await submissionRepo.findFirst({
			entity_type: validatedInput.entityType,
			entity_id: validatedInput.entityId,
			type: validatedInput.type,
			status: "approval_pending",
			created_by: currentUserId,
		});
		if (existingPending) {
			throw new Error(
				"You already have a pending submission for this entity and submission type.",
			);
		}
	}

	return submissionRepo.create({
		entity_type: validatedInput.entityType,
		entity_id: validatedInput.entityId ?? null,
		type: validatedInput.type,
		status: nextStatus,
		data: normalizeSubmissionJson(validatedInput.data),
		diff: normalizeOptionalSubmissionJson(validatedInput.diff),
		meta: normalizeOptionalSubmissionJson(validatedInput.meta),
		creator: currentUserId ? { connect: { id: currentUserId } } : undefined,
	});
}

export async function updateSubmission(input: SubmissionUpdatePayload) {
	const validatedInput = validateSubmissionUpdateInput(input);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	const scope = getTableScope(ctx, "submission", "update");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		return submissionRepo.update(validatedInput.id, {
			data:
				validatedInput.data !== undefined
					? normalizeSubmissionJson(validatedInput.data)
					: undefined,
			diff: normalizeOptionalSubmissionJson(validatedInput.diff),
			meta: normalizeOptionalSubmissionJson(validatedInput.meta),
			status: validatedInput.status ?? undefined,
		});
	}
	const existing = await submissionRepo.findFirst({
		id: validatedInput.id,
		created_by: ownerId,
	});
	if (!existing) {
		throw new Error("Not authorized to update this submission.");
	}
	return submissionRepo.update(existing.id, {
		data:
			validatedInput.data !== undefined
				? normalizeSubmissionJson(validatedInput.data)
				: undefined,
		diff: normalizeOptionalSubmissionJson(validatedInput.diff),
		meta: normalizeOptionalSubmissionJson(validatedInput.meta),
		status: validatedInput.status ?? undefined,
	});
}

export async function reviewSubmission(input: SubmissionReviewPayload) {
	const validatedInput = validateSubmissionReviewInput(input);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	const scope = getTableScope(ctx, "submission", "update");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	const submission = ownerId
		? await submissionRepo.findFirst({ id: validatedInput.id, created_by: ownerId })
		: await submissionRepo.findById(validatedInput.id);
	if (!submission) {
		throw new Error("Not authorized to review this submission.");
	}
	if (
		typeof submission.status === "string" &&
		submission.status !== "approval_pending" &&
		submission.status !== "rejected"
	) {
		throw new Error("Only pending or rejected submissions can be reviewed.");
	}

	if (submission.entity_type === "institution") {
		let institutionAction: "create" | "delete" | "update";
		if (submission.type === "create") {
			institutionAction = "create";
		} else if (submission.type === "delete") {
			institutionAction = "delete";
		} else {
			institutionAction = "update";
		}
		authorizeTable(ctx, "institution", institutionAction);
		if (typeof submission.entity_id === "number") {
			const institutionScope = getTableScope(
				ctx,
				"institution",
				institutionAction,
			);
			const institutionWhere = buildInstitutionScopedWhere(
				institutionScope,
				currentUserId,
				{ id: submission.entity_id },
			);
			const authorizedInstitution = institutionWhere
				? await prisma.institution.findFirst({
						where: institutionWhere,
						select: { id: true },
					})
				: null;
			if (!authorizedInstitution) {
				throw new Error(
					"Not authorized to review this institution submission.",
				);
			}
		}
	}
	let intent: AuditContext["intent"];
	if (validatedInput.status === "approved") {
		intent = "submission_review_approved";
	} else if (validatedInput.status === "rejected") {
		intent = "submission_review_rejected";
	} else {
		intent = "submission_review_completed";
	}
	const correlationId = `submission:${validatedInput.id}:review:${Date.now()}`;
	const claimSubmissionEntityId =
		submission.type === "claim" && typeof submission.entity_id === "number"
			? submission.entity_id
			: null;
	const claimSubmissionCreatorId =
		submission.type === "claim" ? submission.created_by : null;
	const standardSubmissionCreatorId =
		submission.type !== "claim" ? submission.created_by : null;
	const standardSubmissionDraftName =
		submission.entity_type === "institution"
			? institutionSubmissionToDraft(submission).name.trim()
			: "";
	const standardSubmissionEntityName =
		standardSubmissionCreatorId && typeof submission.entity_id === "number"
			? ((
					await prisma.institution.findUnique({
						where: { id: submission.entity_id },
						select: { name: true },
					})
				)?.name?.trim() ?? "")
			: "";

	const sendStandardSubmissionDecisionEmail = async (
		decision: "approved" | "rejected",
	) => {
		if (!standardSubmissionCreatorId) return;
		const recipient = await prisma.user.findUnique({
			where: { id: standardSubmissionCreatorId },
			select: { email: true, first_name: true, last_name: true },
		});
		const institutionName =
			standardSubmissionDraftName || standardSubmissionEntityName;
		if (!recipient?.email || !institutionName) return;
		await sendSubmissionDecisionEmail({
			decision,
			email: recipient.email,
			firstName: recipient.first_name,
			lastName: recipient.last_name,
			institutionName,
		});
	};

	return runWithAuditContext(
		{
			correlationId,
			rootEntityType: "submission",
			rootEntityId: String(validatedInput.id),
			actorUserId: currentUserId,
			intent,
		},
		async () => {
			if (validatedInput.status === "approved") {
				if (submission.entity_type !== "institution") {
					throw new Error("Only institution submissions can be reviewed.");
				}

				const draft = institutionSubmissionToDraft(submission);
				const draftWithInternalNotes = {
					...draft,
					internal_notes:
						typeof validatedInput.internalNotes === "string"
							? validatedInput.internalNotes
							: draft.internal_notes,
				};
				await prisma.$transaction(async (tx) => {
					if (submission.type === "create") {
						authorizeTable(ctx, "institution", "create");
						const fields = buildInstitutionPermissionFields(
							draftWithInternalNotes,
						);
						const allowedFields = new Set(
							fields.filter((field) =>
								canFields(ctx, "institution", [field], "create"),
							),
						);
						const sanitizedDraft = filterInstitutionInputByPermissionFields(
							draftWithInternalNotes,
							allowedFields,
						);
						const name = sanitizedDraft.name;
						if (!name || typeof name !== "string" || name.trim().length === 0) {
							throw new Error(
								"Create submission does not include permitted required fields.",
							);
						}
						const createdInstitution = await tx.institution.create({
							data: buildInstitutionCreateData(
								{
									...draftWithInternalNotes,
									...sanitizedDraft,
									name,
								},
								currentUserId,
							),
							select: { id: true },
						});
						const submissionMeta =
							submission.meta &&
							typeof submission.meta === "object" &&
							!Array.isArray(submission.meta)
								? (submission.meta as Record<string, unknown>)
								: null;
						const requestClaimOnApproval =
							submissionMeta?.request_claim_on_approval === true;
						const shouldGrantSubmitterAccess =
							requestClaimOnApproval &&
							validatedInput.grantSubmitterAccess === true;

						if (shouldGrantSubmitterAccess) {
							if (!submission.created_by) {
								throw new Error("Create submission is missing submitter id.");
							}
							if (!canFields(ctx, "institution", ["users"], "create")) {
								throw new Error(
									"Not authorized to grant submitter access on institution creation.",
								);
							}
							await tx.institution.update({
								where: { id: createdInstitution.id },
								data: { users: { connect: { id: submission.created_by } } },
							});
						}
					}

					if (submission.type === "update") {
						authorizeTable(ctx, "institution", "update");
						if (!submission.entity_id) {
							throw new Error("Update submission is missing institution id.");
						}
						const institutionScope = getTableScope(
							ctx,
							"institution",
							"update",
						);
						const institutionWhere = buildInstitutionScopedWhere(
							institutionScope,
							currentUserId,
							{ id: submission.entity_id },
						);
						const authorizedInstitution = institutionWhere
							? await tx.institution.findFirst({
									where: institutionWhere,
									select: { id: true, name: true },
								})
							: null;
						if (!authorizedInstitution) {
							throw new Error("Not authorized to update this institution.");
						}
						const fields = buildInstitutionPermissionFields(
							draftWithInternalNotes,
						);
						const allowedFields = new Set(
							fields.filter((field) =>
								canFields(ctx, "institution", [field], "update"),
							),
						);
						const sanitizedDraft = filterInstitutionInputByPermissionFields(
							draftWithInternalNotes,
							allowedFields,
						);
						const resolvedName =
							typeof sanitizedDraft.name === "string" &&
							sanitizedDraft.name.trim().length > 0
								? sanitizedDraft.name
								: authorizedInstitution.name;
						const updateInput = {
							...draftWithInternalNotes,
							...sanitizedDraft,
							id: submission.entity_id,
							name: resolvedName,
						};
						await tx.institution.update({
							where: { id: submission.entity_id },
							data: buildInstitutionUpdateData(updateInput, currentUserId),
						});
					}

					if (submission.type === "claim") {
						if (!submission.entity_id) {
							throw new Error("Claim submission is missing institution id.");
						}
						if (!submission.created_by) {
							throw new Error("Claim submission is missing claimant id.");
						}
						const institutionScope = getTableScope(
							ctx,
							"institution",
							"update",
						);
						const institutionWhere = buildInstitutionScopedWhere(
							institutionScope,
							currentUserId,
							{ id: submission.entity_id },
						);
						const targetInstitution = institutionWhere
							? await tx.institution.findFirst({ where: institutionWhere })
							: null;
						if (!targetInstitution) {
							throw new Error("Not authorized to claim this institution.");
						}
						await tx.institution.update({
							where: { id: submission.entity_id },
							data: { users: { connect: { id: submission.created_by } } },
						});
					}

					if (submission.type === "delete") {
						authorizeTable(ctx, "institution", "delete");
						if (!submission.entity_id) {
							throw new Error("Delete submission is missing institution id.");
						}
						await tx.institution.delete({
							where: { id: submission.entity_id },
						});
					}

					await tx.submission.delete({ where: { id: validatedInput.id } });
					await updateSubmissionAuditStatus(
						{
							submissionId: validatedInput.id,
							status: "approved",
							reviewerId: currentUserId,
							reviewNotes: validatedInput.internalNotes,
						},
						tx,
					);
				});
				if (claimSubmissionEntityId && claimSubmissionCreatorId) {
					const [claimant, institution] = await Promise.all([
						prisma.user.findUnique({
							where: { id: claimSubmissionCreatorId },
							select: { email: true, first_name: true, last_name: true },
						}),
						prisma.institution.findUnique({
							where: { id: claimSubmissionEntityId },
							select: { name: true },
						}),
					]);
					if (claimant?.email && institution?.name) {
						await sendClaimDecisionEmail({
							decision: "approved",
							email: claimant.email,
							firstName: claimant.first_name,
							lastName: claimant.last_name,
							institutionName: institution.name,
						});
					}
				}
				if (standardSubmissionCreatorId) {
					await sendStandardSubmissionDecisionEmail("approved");
				}
				revalidateAccount();
				return { id: validatedInput.id, status: "approved" as const };
			}

			const updated = await prisma.$transaction(async (tx) => {
				const txUpdated = await tx.submission.update({
					where: { id: validatedInput.id },
					data: {
						status: validatedInput.status,
						review_notes: validatedInput.internalNotes ?? undefined,
						reviewer: currentUserId
							? { connect: { id: currentUserId } }
							: undefined,
						reviewed_at: new Date(),
					},
				});
				await updateSubmissionAuditStatus(
					{
						submissionId: validatedInput.id,
						status:
							validatedInput.status === "rejected" ? "rejected" : "completed",
						reviewerId: currentUserId,
						reviewNotes: validatedInput.internalNotes,
					},
					tx,
				);
				return txUpdated;
			});
			if (
				validatedInput.status === "rejected" &&
				claimSubmissionEntityId &&
				claimSubmissionCreatorId
			) {
				const [claimant, institution] = await Promise.all([
					prisma.user.findUnique({
						where: { id: claimSubmissionCreatorId },
						select: { email: true, first_name: true, last_name: true },
					}),
					prisma.institution.findUnique({
						where: { id: claimSubmissionEntityId },
						select: { name: true },
					}),
				]);
				if (claimant?.email && institution?.name) {
					await sendClaimDecisionEmail({
						decision: "rejected",
						email: claimant.email,
						firstName: claimant.first_name,
						lastName: claimant.last_name,
						institutionName: institution.name,
					});
				}
			}
			if (validatedInput.status === "rejected" && standardSubmissionCreatorId) {
				await sendStandardSubmissionDecisionEmail("rejected");
			}
			revalidateAccount();
			return updated;
		},
	);
}

export async function reviewClaimSubmission(input: ClaimReviewPayload) {
	const validatedInput = validateClaimReviewInput(input);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	requireAllScope(ctx, "submission", "update");

	const submission = await submissionRepo.findById(validatedInput.id);
	if (!submission) {
		throw new Error("Claim submission not found.");
	}
	if (submission.type !== "claim") {
		throw new Error("Submission is not a claim.");
	}
	if (
		submission.status !== "approval_pending" &&
		submission.status !== "rejected"
	) {
		throw new Error("Only pending or rejected submissions can be reviewed.");
	}
	authorizeTable(ctx, "institution", "update");
	if (typeof submission.entity_id === "number") {
		const institutionScope = getTableScope(ctx, "institution", "update");
		const institutionWhere = buildInstitutionScopedWhere(
			institutionScope,
			currentUserId,
			{ id: submission.entity_id },
		);
		const authorizedInstitution = institutionWhere
			? await prisma.institution.findFirst({
					where: institutionWhere,
					select: { id: true },
				})
			: null;
		if (!authorizedInstitution) {
			throw new Error("Not authorized to claim this institution.");
		}
	}
	const intent: AuditContext["intent"] =
		validatedInput.decision === "approved"
			? "submission_review_approved"
			: "submission_review_rejected";
	const correlationId = `submission:${validatedInput.id}:review:${Date.now()}`;
	const claimSubmissionEntityId =
		typeof submission.entity_id === "number" ? submission.entity_id : null;
	const claimSubmissionCreatorId = submission.created_by;
	return runWithAuditContext(
		{
			correlationId,
			rootEntityType: "submission",
			rootEntityId: String(validatedInput.id),
			actorUserId: currentUserId,
			intent,
		},
		async () => {
			if (validatedInput.decision === "rejected") {
				await prisma.$transaction(async (tx) => {
					await tx.submission.delete({ where: { id: validatedInput.id } });
					await updateSubmissionAuditStatus(
						{
							submissionId: validatedInput.id,
							status: "rejected",
							reviewerId: currentUserId,
							reviewNotes: validatedInput.reviewNotes,
						},
						tx,
					);
				});
				if (claimSubmissionEntityId && claimSubmissionCreatorId) {
					const [claimant, institution] = await Promise.all([
						prisma.user.findUnique({
							where: { id: claimSubmissionCreatorId },
							select: { email: true, first_name: true, last_name: true },
						}),
						prisma.institution.findUnique({
							where: { id: claimSubmissionEntityId },
							select: { name: true },
						}),
					]);
					if (claimant?.email && institution?.name) {
						await sendClaimDecisionEmail({
							decision: "rejected",
							email: claimant.email,
							firstName: claimant.first_name,
							lastName: claimant.last_name,
							institutionName: institution.name,
						});
					}
				}
				revalidateAccount();
				return { id: validatedInput.id, status: "rejected" as const };
			}

			const entityId = submission.entity_id;
			const claimantId = submission.created_by;
			if (!entityId || !claimantId) {
				throw new Error("Claim submission missing entity or user.");
			}

			await prisma.$transaction(async (tx) => {
				await tx.institution.update({
					where: { id: entityId },
					data: { users: { connect: { id: claimantId } } },
				});

				await tx.user.update({
					where: { id: claimantId },
					data: { institutions: { connect: { id: entityId } } },
				});

				await tx.submission.delete({ where: { id: validatedInput.id } });
				await updateSubmissionAuditStatus(
					{
						submissionId: validatedInput.id,
						status: "approved",
						reviewerId: currentUserId,
						reviewNotes: validatedInput.reviewNotes,
					},
					tx,
				);
			});

			if (claimSubmissionEntityId && claimSubmissionCreatorId) {
				const [claimant, institution] = await Promise.all([
					prisma.user.findUnique({
						where: { id: claimSubmissionCreatorId },
						select: { email: true, first_name: true, last_name: true },
					}),
					prisma.institution.findUnique({
						where: { id: claimSubmissionEntityId },
						select: { name: true },
					}),
				]);
				if (claimant?.email && institution?.name) {
					await sendClaimDecisionEmail({
						decision: "approved",
						email: claimant.email,
						firstName: claimant.first_name,
						lastName: claimant.last_name,
						institutionName: institution.name,
					});
				}
			}
			revalidateAccount();
			return { id: validatedInput.id, status: "approved" as const };
		},
	);
}

export async function deleteSubmission(id: number) {
	const validatedId = validateSubmissionId(id);
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "delete");
	const scope = getTableScope(ctx, "submission", "delete");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		await submissionRepo.remove(validatedId);
		return { id: validatedId };
	}
	const existing = await submissionRepo.findFirst({
		id: validatedId,
		created_by: ownerId,
	});
	if (!existing) {
		throw new Error("Not authorized to delete this submission.");
	}
	await submissionRepo.remove(existing.id);
	return { id: validatedId };
}
