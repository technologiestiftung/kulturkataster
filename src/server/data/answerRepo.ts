import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

const answerInclude = {
	question: true,
	institution: true,
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
	remove: (id: number) => prisma.answer.delete({ where: { id } }),
};
