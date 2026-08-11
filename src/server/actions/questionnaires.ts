"use server";

import type { Prisma } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { questionnaireRepo } from "@/server/data/questionnaireRepo";
import { answerRepo } from "@/server/data/answerRepo";
import { logger } from "@/server/logging/logger";
import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";

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

export async function submitQuestionnaireAnswers(params: {
	questionnaireId: number;
	institutionId?: number;
	submissionId?: number;
	answers: { questionId: number; value: Prisma.InputJsonValue }[];
	submitterName?: string;
	submitterEmail?: string;
}) {
	const { institutionId, submissionId } = params;
	if ((institutionId === undefined) === (submissionId === undefined)) {
		return { ok: false as const, error: "invalid_target" as const };
	}

	try {
		const alreadySubmitted = await answerRepo.hasAnswered({
			questionnaireId: params.questionnaireId,
			institutionId,
			submissionId,
		});
		if (alreadySubmitted) {
			return { ok: false as const, error: "already_submitted" as const };
		}

		const currentUserId = await getCurrentUserId();

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

// Admin-only: re-point a pending submission's linked answers at a different
// submission or an approved institution — e.g. the proposed venue turns out to be
// a duplicate of an existing one. Gated the same way reviewSubmission gates
// reviewing a submission, since this is a submission-management operation.
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
