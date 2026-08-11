"use server";

import type { Prisma } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { questionnaireRepo } from "@/server/data/questionnaireRepo";
import { answerRepo } from "@/server/data/answerRepo";
import { logger } from "@/server/logging/logger";

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

export async function submitQuestionnaireAnswers(params: {
	questionnaireId: number;
	institutionId: number;
	answers: { questionId: number; value: Prisma.InputJsonValue }[];
	submitterName?: string;
	submitterEmail?: string;
}) {
	try {
		const currentUserId = await getCurrentUserId();

		await answerRepo.createMany(
			params.answers.map((answer) => ({
				questionnaire_id: params.questionnaireId,
				question_id: answer.questionId,
				institution_id: params.institutionId,
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
