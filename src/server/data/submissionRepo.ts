import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

export const submissionRepo = {
	list: (where?: Prisma.SubmissionWhereInput, take = 100) =>
		prisma.submission.findMany({
			where,
			take,
			orderBy: { created_at: "desc" },
		}),
	findById: (id: number) => prisma.submission.findUnique({ where: { id } }),
	create: (data: Prisma.SubmissionCreateInput) =>
		prisma.submission.create({ data }),
	update: (id: number, data: Prisma.SubmissionUpdateInput) =>
		prisma.submission.update({ where: { id }, data }),
	remove: (id: number) => prisma.submission.delete({ where: { id } }),
};
