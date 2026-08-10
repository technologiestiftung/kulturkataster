import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

const questionnaireWithQuestionsInclude = {
	questions: { orderBy: [{ step: "asc" }, { order: "asc" }] },
} satisfies Prisma.QuestionnaireInclude;

export const questionnaireRepo = {
	list: (where?: Prisma.QuestionnaireWhereInput, take = 100) =>
		prisma.questionnaire.findMany({
			where,
			take,
			orderBy: { created_at: "desc" },
		}),
	listOpen: () =>
		prisma.questionnaire.findMany({
			where: { status: "open" },
			orderBy: { created_at: "desc" },
		}),
	findById: (id: number) =>
		prisma.questionnaire.findUnique({
			where: { id },
			include: questionnaireWithQuestionsInclude,
		}),
	create: (data: Prisma.QuestionnaireCreateInput) =>
		prisma.questionnaire.create({ data }),
	update: (id: number, data: Prisma.QuestionnaireUpdateInput) =>
		prisma.questionnaire.update({ where: { id }, data }),
	remove: (id: number) => prisma.questionnaire.delete({ where: { id } }),
};
