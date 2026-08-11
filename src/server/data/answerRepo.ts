import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

const answerInclude = {
	question: true,
	institution: true,
	submission: true,
} satisfies Prisma.AnswerInclude;

export const answerRepo = {
	create: (data: Prisma.AnswerCreateInput) =>
		prisma.answer.create({ data, include: answerInclude }),
	createMany: (data: Prisma.AnswerCreateManyInput[]) =>
		prisma.answer.createMany({ data }),
	listByQuestionnaireAndInstitution: (
		questionnaireId: number,
		institutionId: number,
	) =>
		prisma.answer.findMany({
			where: {
				questionnaire_id: questionnaireId,
				institution_id: institutionId,
			},
			orderBy: { created_at: "asc" },
			include: answerInclude,
		}),
	listLatestByQuestionnaireAndInstitution: (
		questionnaireId: number,
		institutionId: number,
	) =>
		prisma.answer.findMany({
			where: {
				questionnaire_id: questionnaireId,
				institution_id: institutionId,
			},
			distinct: ["question_id"],
			orderBy: { created_at: "desc" },
			include: answerInclude,
		}),
	listByQuestionnaire: (questionnaireId: number) =>
		prisma.answer.findMany({
			where: { questionnaire_id: questionnaireId },
			orderBy: { created_at: "asc" },
			include: answerInclude,
		}),
	listBySubmission: (submissionId: number) =>
		prisma.answer.findMany({
			where: { submission_id: submissionId },
			orderBy: { created_at: "asc" },
			include: answerInclude,
		}),
	remove: (id: number) => prisma.answer.delete({ where: { id } }),
	// Points every Answer row currently linked to `fromSubmissionId` at a different
	// target — an approved Institution (the common case, once its proposal is
	// approved) or a different Submission (e.g. merging into an existing proposal).
	// Exactly one of toInstitutionId/toSubmissionId is expected; validation of that
	// XOR is the caller's responsibility (mirrors submitQuestionnaireAnswers).
	relink: (params: {
		fromSubmissionId: number;
		toInstitutionId?: number;
		toSubmissionId?: number;
	}) =>
		prisma.answer.updateMany({
			where: { submission_id: params.fromSubmissionId },
			data: {
				institution_id: params.toInstitutionId ?? null,
				submission_id: params.toSubmissionId ?? null,
			},
		}),
	hasAnswered: async (params: {
		questionnaireId: number;
		institutionId?: number;
		submissionId?: number;
	}) => {
		const existing = await prisma.answer.findFirst({
			where: {
				questionnaire_id: params.questionnaireId,
				...(params.institutionId !== undefined
					? { institution_id: params.institutionId }
					: {}),
				...(params.submissionId !== undefined
					? { submission_id: params.submissionId }
					: {}),
			},
			select: { id: true },
		});
		return existing !== null;
	},
};
