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
import { ClaimSubmission, ClaimSubmissionDetail } from "@/types";
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
	SubmissionNoteCreatePayload,
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
	validateSubmissionNoteCreateInput,
	validateSubmissionReviewInput,
	validateSubmissionUpdateInput,
} from "@/server/validation/submissions";
import { logger } from "@/server/logging/logger";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";

type ClaimInstitutionRow = Prisma.InstitutionGetPayload<{
	include: {
		address: true;
		users: true;
		groups: true;
		contact_person: true;
		categories: true;
		tags: true;
	};
}>;

const withExistingAddressId = <T extends { address?: unknown }>(
	draft: T,
	addressId?: number | null,
): T => {
	if (!addressId || typeof draft.address !== "object" || !draft.address) {
		return draft;
	}
	return {
		...draft,
		address: {
			...(draft.address as Record<string, unknown>),
			id:
				typeof (draft.address as Record<string, unknown>).id === "number"
					? (draft.address as Record<string, unknown>).id
					: addressId,
		},
	};
};

const sanitizeCategoryKey = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");

const getSubmissionCreateLogContext = (
	input: Partial<SubmissionCreatePayload>,
	currentUserId?: string | null,
) => ({
	subsystem: "submission",
	actor_user_id: currentUserId ?? null,
	entity_type: input.entityType ?? null,
	entity_id: input.entityId ?? null,
	submission_type: input.type ?? null,
	has_data: input.data !== undefined && input.data !== null,
	has_diff: input.diff !== undefined && input.diff !== null,
	has_meta: input.meta !== undefined && input.meta !== null,
});

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
	let submissions: ClaimSubmission[];
	try {
		submissions = await prisma.submission.findMany({
			where: { type: "claim", created_by: userId ?? undefined },
			orderBy: { created_at: "desc" },
			include: {
				notes: {
					include: {
						creator: true,
					},
					orderBy: {
						created_at: "desc",
					},
				},
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
	} catch (error) {
		logger.error("submission.claim_list.db_failed", error, {
			subsystem: "submission",
			db_subsystem: "db",
			actor_user_id: currentUserId,
			target_user_id: userId ?? null,
		});
		throw error;
	}

	const institutionIds = submissions
		.map((submission) => submission.entity_id)
		.filter((id): id is number => typeof id === "number");

	let institutions: ClaimInstitutionRow[] = [];
	if (institutionIds.length) {
		try {
			institutions = await prisma.institution.findMany({
				where: { id: { in: institutionIds } },
				include: {
					address: true,
					users: true,
					groups: true,
					contact_person: true,
					categories: true,
					tags: true,
				},
			});
		} catch (error) {
			logger.error("submission.claim_institutions.db_failed", error, {
				subsystem: "submission",
				db_subsystem: "db",
				actor_user_id: currentUserId,
				institution_ids_count: institutionIds.length,
			});
			throw error;
		}
	}

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
	return runWithServerRequestContext(
		async () => {
			let currentUserId: string | null = null;
			let validatedInput: SubmissionCreatePayload | undefined;
			try {
				validatedInput = validateSubmissionCreateInput(input);
				currentUserId = await getCurrentUserId();
				setRequestContext({ userId: currentUserId });
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

				return await submissionRepo.create({
					entity_type: validatedInput.entityType,
					entity_id: validatedInput.entityId ?? null,
					type: validatedInput.type,
					status: nextStatus,
					data: normalizeSubmissionJson(validatedInput.data),
					diff: normalizeOptionalSubmissionJson(validatedInput.diff),
					meta: normalizeOptionalSubmissionJson(validatedInput.meta),
					creator: currentUserId
						? { connect: { id: currentUserId } }
						: undefined,
				});
			} catch (error) {
				logger.error(
					"submission.create.failed",
					error,
					getSubmissionCreateLogContext(validatedInput ?? input, currentUserId),
				);
				throw error;
			}
		},
		{ route: "server_action:submissions.createSubmission" },
	);
}

export async function updateSubmission(input: SubmissionUpdatePayload) {
	return runWithServerRequestContext(
		async () => {
			const validatedInput = validateSubmissionUpdateInput(input);
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "submission", "update");
			const scope = getTableScope(ctx, "submission", "update");
			const ownerId = requireScopeOrUser(scope, currentUserId);
			const where: Prisma.SubmissionWhereInput = ownerId
				? { id: validatedInput.id, created_by: ownerId }
				: { id: validatedInput.id };
			const normalizedUpdate: Prisma.SubmissionUpdateInput = {
				data:
					validatedInput.data !== undefined
						? normalizeSubmissionJson(validatedInput.data)
						: undefined,
				diff: normalizeOptionalSubmissionJson(validatedInput.diff),
				meta: normalizeOptionalSubmissionJson(validatedInput.meta),
				status: validatedInput.status ?? undefined,
			};

			if (ownerId) {
				const existing = await submissionRepo.findFirst(where);
				if (!existing) {
					throw new Error("Not authorized to update this submission.");
				}
			}
			try {
				const result = await submissionRepo.updateWhere(
					where,
					normalizedUpdate,
				);
				if (result.count === 0) {
					throw new Error("Submission no longer exists.");
				}
				const updated = ownerId
					? await submissionRepo.findFirst(where)
					: await submissionRepo.findById(validatedInput.id);
				if (!updated) {
					throw new Error("Submission no longer exists.");
				}
				return updated;
			} catch (error) {
				logger.error("submission.update.db_failed", error, {
					subsystem: "submission",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					submission_id: validatedInput.id,
				});
				throw error;
			}
		},
		{ route: "server_action:submissions.updateSubmission" },
	);
}

export async function reviewSubmission(input: SubmissionReviewPayload) {
	return runWithServerRequestContext(
		async () => {
			const validatedInput = validateSubmissionReviewInput(input);
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "submission", "update");
			const scope = getTableScope(ctx, "submission", "update");
			const ownerId = requireScopeOrUser(scope, currentUserId);
			const submission = ownerId
				? await submissionRepo.findFirst({
						id: validatedInput.id,
						created_by: ownerId,
					})
				: await submissionRepo.findById(validatedInput.id);
			if (!submission) {
				throw new Error("Not authorized to review this submission.");
			}
			if (
				typeof submission.status === "string" &&
				submission.status !== "approval_pending" &&
				submission.status !== "rejected"
			) {
				throw new Error(
					"Only pending or rejected submissions can be reviewed.",
				);
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
			if (submission.entity_type === "category") {
				authorizeTable(ctx, "category", "create");
				requireAllScope(ctx, "category", "create");
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
				if (!validatedInput.notifySubmitter) return;
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

			return logger.time(
				{
					level: "info",
					event: "submission.review.duration",
					logSuccess: false,
					successData: {
						actor_user_id: currentUserId,
						submission_id: validatedInput.id,
						submission_type: submission.type,
						entity_type: submission.entity_type,
						entity_id: submission.entity_id,
						decision: validatedInput.status,
						correlation_id: correlationId,
					},
					errorEvent: "submission.review.failed",
					errorData: {
						actor_user_id: currentUserId,
						submission_id: validatedInput.id,
						submission_type: submission.type,
						entity_type: submission.entity_type,
						entity_id: submission.entity_id,
						decision: validatedInput.status,
						correlation_id: correlationId,
					},
					slowThresholdMs: 3000,
					slowEvent: "submission.review.slow",
					slowData: {
						actor_user_id: currentUserId,
						submission_id: validatedInput.id,
						decision: validatedInput.status,
						correlation_id: correlationId,
					},
				},
				() =>
					runWithAuditContext(
						{
							correlationId,
							rootEntityType: "submission",
							rootEntityId: String(validatedInput.id),
							actorUserId: currentUserId,
							intent,
						},
						async () => {
							const trimmedInternalNotes =
								typeof validatedInput.internalNotes === "string" &&
								validatedInput.internalNotes.trim().length > 0
									? validatedInput.internalNotes.trim()
									: null;
							if (validatedInput.status === "approved") {
								if (
									submission.entity_type !== "institution" &&
									submission.entity_type !== "category"
								) {
									throw new Error(
										"Only institution or category submissions can be reviewed.",
									);
								}

								if (submission.entity_type === "category") {
									const categoryData =
										submission.data &&
										typeof submission.data === "object" &&
										!Array.isArray(submission.data)
											? (submission.data as Record<string, unknown>)
											: {};
									const rawKey =
										typeof categoryData.key === "string"
											? categoryData.key
											: "";
									const key = sanitizeCategoryKey(rawKey);
									if (!key) {
										throw new Error(
											"Category submission does not include a key.",
										);
									}

									try {
										await prisma.$transaction(async (tx) => {
											await tx.category.create({
												data: {
													key,
													description:
														typeof categoryData.description === "string"
															? categoryData.description
															: null,
													status: "inactive",
												},
											});

											if (trimmedInternalNotes) {
												await tx.submissionNote.create({
													data: {
														submission: {
															connect: { id: validatedInput.id },
														},
														note: trimmedInternalNotes,
														creator: currentUserId
															? { connect: { id: currentUserId } }
															: undefined,
													},
												});
											}

											await tx.submission.delete({
												where: { id: validatedInput.id },
											});
											await updateSubmissionAuditStatus(
												{
													submissionId: validatedInput.id,
													status: "approved",
													reviewerId: currentUserId,
													reviewNotes: trimmedInternalNotes,
												},
												tx,
											);
										});
									} catch (error) {
										logger.error(
											"submission.category_review.db_failed",
											error,
											{
												subsystem: "submission",
												db_subsystem: "db",
												actor_user_id: currentUserId,
												submission_id: validatedInput.id,
												submission_type: submission.type,
												entity_type: submission.entity_type,
											},
										);
										throw error;
									}

									revalidateAccount();
									return {
										id: validatedInput.id,
										status: "approved" as const,
									};
								}

								const draft = institutionSubmissionToDraft(submission);
								const draftWithInternalNotes = {
									...draft,
									internal_notes:
										typeof validatedInput.internalNotes === "string"
											? validatedInput.internalNotes
											: draft.internal_notes,
								};
								try {
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
											const sanitizedDraft =
												filterInstitutionInputByPermissionFields(
													draftWithInternalNotes,
													allowedFields,
												);
											const name = sanitizedDraft.name;
											if (
												!name ||
												typeof name !== "string" ||
												name.trim().length === 0
											) {
												throw new Error(
													"Create submission does not include permitted required fields.",
												);
											}
											const createdInstitution = await tx.institution.create({
												data: buildInstitutionCreateData(
													{
														...sanitizedDraft,
														name,
														address: sanitizedDraft.address ?? null,
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
													throw new Error(
														"Create submission is missing submitter id.",
													);
												}
												if (
													!canFields(ctx, "institution", ["users"], "create")
												) {
													throw new Error(
														"Not authorized to grant submitter access on institution creation.",
													);
												}
												await tx.institution.update({
													where: { id: createdInstitution.id },
													data: {
														users: { connect: { id: submission.created_by } },
													},
												});
											}

											const hasAttachUsers =
												validatedInput.attachUserIds &&
												validatedInput.attachUserIds.length > 0;
											const hasAttachGroups =
												validatedInput.attachGroupIds &&
												validatedInput.attachGroupIds.length > 0;
											if (hasAttachUsers || hasAttachGroups) {
												await tx.institution.update({
													where: { id: createdInstitution.id },
													data: {
														...(hasAttachUsers && {
															users: {
																connect: validatedInput.attachUserIds!.map(
																	(id) => ({ id }),
																),
															},
														}),
														...(hasAttachGroups && {
															groups: {
																connect: validatedInput.attachGroupIds!.map(
																	(id) => ({ id }),
																),
															},
														}),
													},
												});
											}
										}

										if (submission.type === "update") {
											authorizeTable(ctx, "institution", "update");
											if (!submission.entity_id) {
												throw new Error(
													"Update submission is missing institution id.",
												);
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
														select: { id: true, name: true, address_id: true },
													})
												: null;
											if (!authorizedInstitution) {
												throw new Error(
													"Not authorized to update this institution.",
												);
											}
											const draftWithAddressId = withExistingAddressId(
												draftWithInternalNotes,
												authorizedInstitution.address_id,
											);
											const fields =
												buildInstitutionPermissionFields(draftWithAddressId);
											const allowedFields = new Set(
												fields.filter((field) =>
													canFields(ctx, "institution", [field], "update"),
												),
											);
											const sanitizedDraft =
												filterInstitutionInputByPermissionFields(
													draftWithAddressId,
													allowedFields,
												);
											const resolvedName =
												typeof sanitizedDraft.name === "string" &&
												sanitizedDraft.name.trim().length > 0
													? sanitizedDraft.name
													: authorizedInstitution.name;
											const updateInput = {
												...sanitizedDraft,
												id: submission.entity_id,
												name: resolvedName,
												address: sanitizedDraft.address ?? null,
											};
											await tx.institution.update({
												where: { id: submission.entity_id },
												data: buildInstitutionUpdateData(
													updateInput,
													currentUserId,
												),
											});

											const hasAttachUsers =
												validatedInput.attachUserIds &&
												validatedInput.attachUserIds.length > 0;
											const hasAttachGroups =
												validatedInput.attachGroupIds &&
												validatedInput.attachGroupIds.length > 0;
											if (hasAttachUsers || hasAttachGroups) {
												await tx.institution.update({
													where: { id: submission.entity_id },
													data: {
														...(hasAttachUsers && {
															users: {
																connect: validatedInput.attachUserIds!.map(
																	(id) => ({ id }),
																),
															},
														}),
														...(hasAttachGroups && {
															groups: {
																connect: validatedInput.attachGroupIds!.map(
																	(id) => ({ id }),
																),
															},
														}),
													},
												});
											}
										}

										if (submission.type === "claim") {
											if (!submission.entity_id) {
												throw new Error(
													"Claim submission is missing institution id.",
												);
											}
											if (!submission.created_by) {
												throw new Error(
													"Claim submission is missing claimant id.",
												);
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
												? await tx.institution.findFirst({
														where: institutionWhere,
													})
												: null;
											if (!targetInstitution) {
												throw new Error(
													"Not authorized to claim this institution.",
												);
											}
											await tx.institution.update({
												where: { id: submission.entity_id },
												data: {
													users: { connect: { id: submission.created_by } },
												},
											});
										}

										if (submission.type === "delete") {
											authorizeTable(ctx, "institution", "delete");
											if (!submission.entity_id) {
												throw new Error(
													"Delete submission is missing institution id.",
												);
											}
											await tx.institution.delete({
												where: { id: submission.entity_id },
											});
										}

										if (trimmedInternalNotes) {
											await tx.submissionNote.create({
												data: {
													submission: {
														connect: { id: validatedInput.id },
													},
													note: trimmedInternalNotes,
													creator: currentUserId
														? { connect: { id: currentUserId } }
														: undefined,
												},
											});
										}

										await tx.submission.delete({
											where: { id: validatedInput.id },
										});
										await updateSubmissionAuditStatus(
											{
												submissionId: validatedInput.id,
												status: "approved",
												reviewerId: currentUserId,
												reviewNotes: trimmedInternalNotes,
											},
											tx,
										);
									});
								} catch (error) {
									logger.error("submission.review_approve.db_failed", error, {
										subsystem: "submission",
										db_subsystem: "db",
										actor_user_id: currentUserId,
										submission_id: validatedInput.id,
										submission_type: submission.type,
										entity_type: submission.entity_type,
										entity_id: submission.entity_id,
									});
									throw error;
								}
								if (claimSubmissionEntityId && claimSubmissionCreatorId) {
									const [claimant, institution] = await Promise.all([
										prisma.user.findUnique({
											where: { id: claimSubmissionCreatorId },
											select: {
												email: true,
												first_name: true,
												last_name: true,
											},
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

							let updated;
							try {
								updated = await prisma.$transaction(async (tx) => {
									if (trimmedInternalNotes) {
										await tx.submissionNote.create({
											data: {
												submission: {
													connect: { id: validatedInput.id },
												},
												note: trimmedInternalNotes,
												creator: currentUserId
													? { connect: { id: currentUserId } }
													: undefined,
											},
										});
									}
									const txUpdated = await tx.submission.update({
										where: { id: validatedInput.id },
										data: {
											status: validatedInput.status,
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
												validatedInput.status === "rejected"
													? "rejected"
													: "completed",
											reviewerId: currentUserId,
											reviewNotes: trimmedInternalNotes,
										},
										tx,
									);
									return txUpdated;
								});
							} catch (error) {
								logger.error("submission.review_update.db_failed", error, {
									subsystem: "submission",
									db_subsystem: "db",
									actor_user_id: currentUserId,
									submission_id: validatedInput.id,
									submission_type: submission.type,
									entity_type: submission.entity_type,
									entity_id: submission.entity_id,
								});
								throw error;
							}
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
							if (
								validatedInput.status === "rejected" &&
								standardSubmissionCreatorId
							) {
								await sendStandardSubmissionDecisionEmail("rejected");
							}
							revalidateAccount();
							return updated;
						},
					),
			);
		},
		{ route: "server_action:submissions.reviewSubmission" },
	);
}

export async function saveSubmissionNote(input: SubmissionNoteCreatePayload) {
	return runWithServerRequestContext(
		async () => {
			const validatedInput = validateSubmissionNoteCreateInput(input);
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "submission", "update");
			const scope = getTableScope(ctx, "submission", "update");
			const ownerId = requireScopeOrUser(scope, currentUserId);
			const submission = ownerId
				? await submissionRepo.findFirst({
						id: validatedInput.submissionId,
						created_by: ownerId,
					})
				: await submissionRepo.findById(validatedInput.submissionId);
			if (!submission) {
				throw new Error("Not authorized to add notes to this submission.");
			}
			if (
				typeof submission.status === "string" &&
				submission.status !== "approval_pending" &&
				submission.status !== "rejected"
			) {
				throw new Error(
					"Notes can only be added to pending or rejected submissions.",
				);
			}

			try {
				await submissionRepo.createNote({
					submission: { connect: { id: validatedInput.submissionId } },
					note: validatedInput.note,
					creator: currentUserId
						? { connect: { id: currentUserId } }
						: undefined,
				});
				const updatedSubmission = await submissionRepo.findById(
					validatedInput.submissionId,
				);
				if (!updatedSubmission) {
					throw new Error("Submission not found after saving note.");
				}
				revalidateAccount();
				return updatedSubmission;
			} catch (error) {
				logger.error("submission.note_create.db_failed", error, {
					subsystem: "submission",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					submission_id: validatedInput.submissionId,
				});
				throw error;
			}
		},
		{ route: "server_action:submissions.saveSubmissionNote" },
	);
}

export async function reviewClaimSubmission(input: ClaimReviewPayload) {
	return runWithServerRequestContext(
		async () => {
			const validatedInput = validateClaimReviewInput(input);
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
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
				throw new Error(
					"Only pending or rejected submissions can be reviewed.",
				);
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
			return logger.time(
				{
					level: "info",
					event: "submission.claim_review.duration",
					logSuccess: false,
					successData: {
						actor_user_id: currentUserId,
						submission_id: validatedInput.id,
						entity_id: claimSubmissionEntityId,
						decision: validatedInput.decision,
						correlation_id: correlationId,
					},
					errorEvent: "submission.claim_review.failed",
					errorData: {
						actor_user_id: currentUserId,
						submission_id: validatedInput.id,
						entity_id: claimSubmissionEntityId,
						decision: validatedInput.decision,
						correlation_id: correlationId,
					},
					slowThresholdMs: 3000,
					slowEvent: "submission.claim_review.slow",
					slowData: {
						actor_user_id: currentUserId,
						submission_id: validatedInput.id,
						decision: validatedInput.decision,
						correlation_id: correlationId,
					},
				},
				() =>
					runWithAuditContext(
						{
							correlationId,
							rootEntityType: "submission",
							rootEntityId: String(validatedInput.id),
							actorUserId: currentUserId,
							intent,
						},
						async () => {
							if (validatedInput.decision === "rejected") {
								try {
									await prisma.$transaction(async (tx) => {
										await tx.submission.delete({
											where: { id: validatedInput.id },
										});
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
								} catch (error) {
									logger.error(
										"submission.claim_review_reject.db_failed",
										error,
										{
											subsystem: "submission",
											db_subsystem: "db",
											actor_user_id: currentUserId,
											submission_id: validatedInput.id,
											entity_id: claimSubmissionEntityId,
										},
									);
									throw error;
								}
								if (claimSubmissionEntityId && claimSubmissionCreatorId) {
									const [claimant, institution] = await Promise.all([
										prisma.user.findUnique({
											where: { id: claimSubmissionCreatorId },
											select: {
												email: true,
												first_name: true,
												last_name: true,
											},
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

							try {
								await prisma.$transaction(async (tx) => {
									await tx.institution.update({
										where: { id: entityId },
										data: { users: { connect: { id: claimantId } } },
									});

									await tx.user.update({
										where: { id: claimantId },
										data: { institutions: { connect: { id: entityId } } },
									});

									await tx.submission.delete({
										where: { id: validatedInput.id },
									});
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
							} catch (error) {
								logger.error(
									"submission.claim_review_approve.db_failed",
									error,
									{
										subsystem: "submission",
										db_subsystem: "db",
										actor_user_id: currentUserId,
										submission_id: validatedInput.id,
										entity_id: entityId,
										target_user_id: claimantId,
									},
								);
								throw error;
							}

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
					),
			);
		},
		{ route: "server_action:submissions.reviewClaimSubmission" },
	);
}

export async function deleteSubmission(id: number) {
	return runWithServerRequestContext(
		async () => {
			const validatedId = validateSubmissionId(id);
			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });
			const ctx = await getAccessContextForUser(currentUserId);
			authorizeTable(ctx, "submission", "delete");
			const scope = getTableScope(ctx, "submission", "delete");
			const ownerId = requireScopeOrUser(scope, currentUserId);
			if (!ownerId) {
				try {
					await submissionRepo.remove(validatedId);
				} catch (error) {
					logger.error("submission.delete.db_failed", error, {
						subsystem: "submission",
						db_subsystem: "db",
						actor_user_id: currentUserId,
						submission_id: validatedId,
					});
					throw error;
				}
				return { id: validatedId };
			}
			const existing = await submissionRepo.findFirst({
				id: validatedId,
				created_by: ownerId,
			});
			if (!existing) {
				throw new Error("Not authorized to delete this submission.");
			}
			try {
				await submissionRepo.remove(existing.id);
			} catch (error) {
				logger.error("submission.delete.db_failed", error, {
					subsystem: "submission",
					db_subsystem: "db",
					actor_user_id: currentUserId,
					submission_id: existing.id,
				});
				throw error;
			}
			return { id: validatedId };
		},
		{ route: "server_action:submissions.deleteSubmission" },
	);
}
