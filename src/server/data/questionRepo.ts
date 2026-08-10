import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

export const questionRepo = {
	listByQuestionnaire: (questionnaireId: number) =>
		prisma.question.findMany({
			where: { questionnaire_id: questionnaireId },
			orderBy: [{ step: "asc" }, { order: "asc" }],
		}),
	findById: (id: number) => prisma.question.findUnique({ where: { id } }),
	create: (data: Prisma.QuestionCreateInput) =>
		prisma.question.create({ data }),
	update: (id: number, data: Prisma.QuestionUpdateInput) =>
		prisma.question.update({ where: { id }, data }),
	remove: (id: number) => prisma.question.delete({ where: { id } }),
};
