"use server";
import {
	actionError,
	actionOk,
	type ActionResult,
} from "@/lib/actions/actionResult";
import {
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
} from "@/server/utils/rbac";
import { getCurrentUserId } from "@/server/actions/auth";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { institutionRepo } from "@/server/data/institutionRepo";
import { questionnaireRepo } from "@/server/data/questionnaireRepo";
import { answerRepo } from "@/server/data/answerRepo";
import type { Prisma } from "@/generated/prisma";
import { assertPositiveInteger } from "@/server/validation/common";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { logger } from "@/server/logging/logger";

export type QuestionnaireExportErrorCode =
	| "forbidden"
	| "noOpenQuestionnaire"
	| "noAnswers"
	| "unexpected";

type AnswerWithQuestion = Prisma.AnswerGetPayload<{
	include: { question: true; institution: true };
}>;

export type QuestionnaireAnswerExportRow = {
	questionKey: string;
	questionLabel: string;
	value: unknown;
	submitterName: string | null;
	submitterEmail: string | null;
	answeredAt: Date;
};

export type InstitutionQuestionnaireExport = {
	questionnaireTitle: string;
	institutionName: string;
	rows: QuestionnaireAnswerExportRow[];
};

const classifyQuestionnaireExportError = (
	error: unknown,
): QuestionnaireExportErrorCode => {
	if (error instanceof Error && error.name === "RBACError") return "forbidden";
	return "unexpected";
};

export async function getInstitutionQuestionnaireAnswersForExport(
	institutionId: number,
	questionnaireId?: number,
): Promise<
	ActionResult<InstitutionQuestionnaireExport, QuestionnaireExportErrorCode>
> {
	return runWithServerRequestContext(
		async () => {
			let validatedInstitutionId: number;
			try {
				validatedInstitutionId = assertPositiveInteger(
					institutionId,
					"Institution id must be positive.",
				);
			} catch (error) {
				return actionError(classifyQuestionnaireExportError(error));
			}

			const currentUserId = await getCurrentUserId();
			setRequestContext({ userId: currentUserId });

			let institutionName: string;
			try {
				const ctx = await getAccessContextForUser(currentUserId);
				authorizeTable(ctx, "answer", "read");

				const institutionScope = getTableScope(ctx, "institution", "read");
				const accessWhere = buildInstitutionScopedWhere(
					institutionScope,
					currentUserId,
					{ id: validatedInstitutionId },
				);
				if (!accessWhere) {
					return actionError("forbidden");
				}
				const institution = await institutionRepo.findFirstWithSelect(
					accessWhere,
					{ id: true, name: true },
				);
				if (!institution) {
					return actionError("forbidden");
				}
				institutionName = institution.name;
			} catch (error) {
				return actionError(classifyQuestionnaireExportError(error));
			}

			try {
				const questionnaire = questionnaireId
					? await questionnaireRepo.findById(questionnaireId)
					: (await questionnaireRepo.listOpen())[0];
				if (!questionnaire) {
					return actionError("noOpenQuestionnaire");
				}

				const answers =
					await answerRepo.listLatestByQuestionnaireAndInstitution(
						questionnaire.id,
						validatedInstitutionId,
					);
				if (answers.length === 0) {
					return actionError("noAnswers");
				}

				const rows = answers
					.slice()
					.sort(
						(a: AnswerWithQuestion, b: AnswerWithQuestion) =>
							a.question.step - b.question.step ||
							a.question.order - b.question.order,
					)
					.map((answer: AnswerWithQuestion) => ({
						questionKey: answer.question.key,
						questionLabel: answer.question.label,
						value: answer.value,
						submitterName: answer.submitter_name,
						submitterEmail: answer.submitter_email,
						answeredAt: answer.created_at,
					}));

				return actionOk({
					questionnaireTitle: questionnaire.title,
					institutionName,
					rows,
				});
			} catch (error) {
				logger.error("questionnaire.export.fetch_failed", error, {
					subsystem: "questionnaire",
					actor_user_id: currentUserId,
					institution_id: validatedInstitutionId,
				});
				return actionError(classifyQuestionnaireExportError(error));
			}
		},
		{
			route:
				"server_action:questionnaires.getInstitutionQuestionnaireAnswersForExport",
		},
	);
}
