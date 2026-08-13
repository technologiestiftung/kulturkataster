"use server";

import type { Prisma } from "@/generated/prisma";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { createSubmission } from "@/server/actions/submissions";
import { questionnaireRepo } from "@/server/data/questionnaireRepo";
import { answerRepo } from "@/server/data/answerRepo";
import { logger } from "@/server/logging/logger";
import { prisma } from "@/server/prisma";
import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { validateSubmissionCreateInput } from "@/server/validation/submissions";
import { normalizeSubmissionJson } from "@/lib/utils/submissionJsonUtils";

export async function getOpenQuestionnaire() {
	try {
		const openQuestionnaires = await questionnaireRepo.listOpen();
		if (openQuestionnaires.length === 0) {
			return { ok: false as const, error: "not_found" as const };
		}
		if (openQuestionnaires.length > 1) {
			logger.warn("questionnaire.multiple_open", {
				subsystem: "questionnaire",
				count: openQuestionnaires.length,
			});
		}

		const questionnaire = await questionnaireRepo.findById(
			openQuestionnaires[0].id,
		);
		if (!questionnaire) {
			return { ok: false as const, error: "not_found" as const };
		}

		return { ok: true as const, questionnaire };
	} catch (error) {
		logger.error("questionnaire.get_open.failed", error, {
			subsystem: "questionnaire",
		});
		return { ok: false as const, error: "unexpected" as const };
	}
}

export async function checkQuestionnaireCompletion(params: {
	questionnaireId: number;
	institutionId?: number;
	submissionId?: number;
}) {
	try {
		const alreadySubmitted = await answerRepo.hasAnswered(params);
		return { ok: true as const, alreadySubmitted };
	} catch (error) {
		logger.error("questionnaire.check_completion.failed", error, {
			subsystem: "questionnaire",
			questionnaire_id: params.questionnaireId,
		});
		return { ok: false as const, error: "unexpected" as const };
	}
}

type NewInstitutionInput = {
	name: unknown;
	address: unknown;
	categoryIds: number[];
	established_since?: unknown;
	newCategoryKeys: string[];
};
// Resolves the institution/submission name to show alongside the questionnaire
// title in the Activity feed ("Fragebogen: <title> – <entity name>"). The
// new-institution path already has this name in hand (the compact form's own
// input) and passes it straight through instead of hitting this lookup.
async function resolveQuestionnaireEntityName(params: {
	institutionId?: number;
	submissionId?: number;
}): Promise<string | null> {
	if (params.institutionId !== undefined) {
		const institution = await prisma.institution.findUnique({
			where: { id: params.institutionId },
			select: { name: true },
		});
		return institution?.name ?? null;
	}
	if (params.submissionId !== undefined) {
		const submission = await prisma.submission.findUnique({
			where: { id: params.submissionId },
			select: { data: true },
		});
		const data = submission?.data;
		const name =
			data && typeof data === "object" && !Array.isArray(data)
				? (data as Record<string, unknown>).name
				: undefined;
		return typeof name === "string" ? name : null;
	}
	return null;
}

async function logQuestionnaireCompletionAudit(params: {
	questionnaireId: number;
	currentUserId: string | null;
	institutionId?: number;
	submissionId?: number;
	entityName?: string | null;
	answerCount: number;
	submitterName?: string;
	submitterEmail?: string;
}) {
	try {
		const questionnaire = await prisma.questionnaire.findUnique({
			where: { id: params.questionnaireId },
			select: { title: true },
		});
		const entityName =
			params.entityName !== undefined
				? params.entityName
				: await resolveQuestionnaireEntityName(params);

		await prisma.entityAudit.create({
			data: {
				entity_id: String(params.questionnaireId),
				entity_type: "questionnaire",
				action: "create",
				status: "completed",
				changed_by: params.currentUserId,
				new_data: {
					questionnaireId: params.questionnaireId,
					questionnaireTitle: questionnaire?.title ?? null,
					entityName,
					institutionId: params.institutionId ?? null,
					submissionId: params.submissionId ?? null,
					answerCount: params.answerCount,
				},
				// "intent" reuses the same meta_info-driven action-label override the
				// submission-review flow already relies on (src/audit.ts / ActivityList),
				// so this renders as "beantwortet"/"answered" instead of the generic
				// "erstellt"/"created" label for action: "create" — no AuditAction enum
				// change needed. submitter_name/email mirror how notifyInstitutionDownload
				// surfaces a guest's identity instead of a bare "System" actor.
				meta_info: {
					intent: "questionnaire_submitted",
					submitter_name: params.submitterName ?? null,
					submitter_email: params.submitterEmail ?? null,
				},
			},
		});
	} catch (error) {
		logger.error("questionnaire.completion_audit.failed", error, {
			subsystem: "questionnaire",
			questionnaire_id: params.questionnaireId,
		});
	}
}

async function submitAnswersForNewInstitution(params: {
	questionnaireId: number;
	newInstitution: NewInstitutionInput;
	answers: { questionId: number; value: Prisma.InputJsonValue }[];
	submitterName?: string;
	submitterEmail?: string;
	currentUserId: string | null;
}) {
	const ctx = await getAccessContextForUser(params.currentUserId);
	authorizeTable(ctx, "submission", "create");

	const validatedSubmissionInput = validateSubmissionCreateInput({
		entityType: SubmissionEntityType.institution,
		entityId: null,
		type: SubmissionType.create,
		data: {
			name: params.newInstitution.name,
			address: params.newInstitution.address,
			categoryIds: params.newInstitution.categoryIds,
			established_since: params.newInstitution.established_since,
		} as Prisma.InputJsonValue,
	});

	const createdSubmission = await prisma.$transaction(async (tx) => {
		const submission = await tx.submission.create({
			data: {
				entity_type: validatedSubmissionInput.entityType,
				entity_id: validatedSubmissionInput.entityId ?? null,
				type: validatedSubmissionInput.type,
				status: "approval_pending",
				data: normalizeSubmissionJson(validatedSubmissionInput.data),
				creator: params.currentUserId
					? { connect: { id: params.currentUserId } }
					: undefined,
			},
			select: { id: true },
		});

		await tx.answer.createMany({
			data: params.answers.map((answer) => ({
				questionnaire_id: params.questionnaireId,
				question_id: answer.questionId,
				submission_id: submission.id,
				value: answer.value,
				created_by: params.currentUserId,
				submitter_name: params.submitterName,
				submitter_email: params.submitterEmail,
			})),
		});

		return submission;
	});

	await logQuestionnaireCompletionAudit({
		questionnaireId: params.questionnaireId,
		currentUserId: params.currentUserId,
		submissionId: createdSubmission.id,
		entityName:
			typeof params.newInstitution.name === "string"
				? params.newInstitution.name
				: null,
		answerCount: params.answers.length,
		submitterName: params.submitterName,
		submitterEmail: params.submitterEmail,
	});

	if (params.newInstitution.newCategoryKeys.length > 0) {
		await Promise.allSettled(
			params.newInstitution.newCategoryKeys.map((key) =>
				createSubmission({
					entityType: SubmissionEntityType.category,
					entityId: null,
					type: SubmissionType.create,
					data: { key },
					meta: {
						source: "questionnaire",
						institutionSubmissionId: createdSubmission.id,
					},
				}),
			),
		);
	}
}

export async function submitQuestionnaireAnswers(params: {
	questionnaireId: number;
	institutionId?: number;
	submissionId?: number;
	newInstitution?: NewInstitutionInput;
	answers: { questionId: number; value: Prisma.InputJsonValue }[];
	submitterName?: string;
	submitterEmail?: string;
}) {
	const { institutionId, submissionId, newInstitution } = params;
	const targetCount = [institutionId, submissionId, newInstitution].filter(
		(value) => value !== undefined,
	).length;
	if (targetCount !== 1) {
		return { ok: false as const, error: "invalid_target" as const };
	}

	try {
		const currentUserId = await getCurrentUserId();

		if (newInstitution) {
			await submitAnswersForNewInstitution({
				questionnaireId: params.questionnaireId,
				newInstitution,
				answers: params.answers,
				submitterName: params.submitterName,
				submitterEmail: params.submitterEmail,
				currentUserId,
			});
			return { ok: true as const };
		}

		const alreadySubmitted = await answerRepo.hasAnswered({
			questionnaireId: params.questionnaireId,
			institutionId,
			submissionId,
		});
		if (alreadySubmitted) {
			return { ok: false as const, error: "already_submitted" as const };
		}

		await answerRepo.createMany(
			params.answers.map((answer) => ({
				questionnaire_id: params.questionnaireId,
				question_id: answer.questionId,
				institution_id: institutionId,
				submission_id: submissionId,
				value: answer.value,
				created_by: currentUserId,
				submitter_name: params.submitterName,
				submitter_email: params.submitterEmail,
			})),
		);

		await logQuestionnaireCompletionAudit({
			questionnaireId: params.questionnaireId,
			currentUserId,
			institutionId,
			submissionId,
			answerCount: params.answers.length,
			submitterName: params.submitterName,
			submitterEmail: params.submitterEmail,
		});

		return { ok: true as const };
	} catch (error) {
		logger.error("questionnaire.submit_answers.failed", error, {
			subsystem: "questionnaire",
			questionnaire_id: params.questionnaireId,
		});
		return { ok: false as const, error: "unexpected" as const };
	}
}

// Admin-only: how many questionnaire answers are currently linked to a pending
// submission — drives whether the review UI shows the re-link section at all.
export async function getLinkedQuestionnaireAnswersCount(submissionId: number) {
	try {
		const currentUserId = await getCurrentUserId();
		const ctx = await getAccessContextForUser(currentUserId);
		authorizeTable(ctx, "submission", "update");

		const answers = await answerRepo.listBySubmission(submissionId);
		return { ok: true as const, count: answers.length };
	} catch (error) {
		logger.error("questionnaire.linked_answers_count.failed", error, {
			subsystem: "questionnaire",
			submission_id: submissionId,
		});
		return { ok: false as const, error: "unexpected" as const };
	}
}

export async function relinkQuestionnaireAnswers(params: {
	fromSubmissionId: number;
	toInstitutionId?: number;
	toSubmissionId?: number;
}) {
	const { toInstitutionId, toSubmissionId } = params;
	if ((toInstitutionId === undefined) === (toSubmissionId === undefined)) {
		return { ok: false as const, error: "invalid_target" as const };
	}

	try {
		const currentUserId = await getCurrentUserId();
		const ctx = await getAccessContextForUser(currentUserId);
		authorizeTable(ctx, "submission", "update");

		const result = await answerRepo.relink(params);
		return { ok: true as const, count: result.count };
	} catch (error) {
		logger.error("questionnaire.relink_answers.failed", error, {
			subsystem: "questionnaire",
			from_submission_id: params.fromSubmissionId,
		});
		return { ok: false as const, error: "unexpected" as const };
	}
}
