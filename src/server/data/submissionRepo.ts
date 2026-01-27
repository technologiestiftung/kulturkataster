import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

export const submissionRepo = {
	list: (where?: Prisma.SubmissionWhereInput, take = 100) =>
		prisma.submission.findMany({
			where,
			take,
			orderBy: { created_at: "desc" },
		}),
	findFirst: (where: Prisma.SubmissionWhereInput) =>
		prisma.submission.findFirst({ where }),
	findById: (id: number) => prisma.submission.findUnique({ where: { id } }),
	create: (data: Prisma.SubmissionCreateInput) =>
		prisma.submission.create({ data }),
	update: (id: number, data: Prisma.SubmissionUpdateInput) =>
		prisma.submission.update({ where: { id }, data }),
	updateWhere: (where: Prisma.SubmissionWhereInput, data: Prisma.SubmissionUpdateInput) =>
		prisma.submission.updateMany({ where, data }),
	remove: (id: number) => prisma.submission.delete({ where: { id } }),
	removeWhere: (where: Prisma.SubmissionWhereInput) =>
		prisma.submission.deleteMany({ where }),
};
