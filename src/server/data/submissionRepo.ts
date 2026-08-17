import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/prisma";

const submissionInclude = {
	creator: true,
	notes: {
		include: {
			creator: true,
		},
		orderBy: {
			created_at: "desc",
		},
	},
	_count: {
		select: { answers: true },
	},
} satisfies Prisma.SubmissionInclude;

export const submissionRepo = {
	list: (where?: Prisma.SubmissionWhereInput, take = 100) =>
		prisma.submission.findMany({
			where,
			take,
			orderBy: { created_at: "desc" },
			include: submissionInclude,
		}),
	findFirst: (where: Prisma.SubmissionWhereInput) =>
		prisma.submission.findFirst({ where, include: submissionInclude }),
	findById: (id: number) =>
		prisma.submission.findUnique({ where: { id }, include: submissionInclude }),
	create: (data: Prisma.SubmissionCreateInput) =>
		prisma.submission.create({ data, include: submissionInclude }),
	update: (id: number, data: Prisma.SubmissionUpdateInput) =>
		prisma.submission.update({
			where: { id },
			data,
			include: submissionInclude,
		}),
	updateWhere: (
		where: Prisma.SubmissionWhereInput,
		data: Prisma.SubmissionUpdateInput,
	) => prisma.submission.updateMany({ where, data }),
	remove: (id: number) => prisma.submission.delete({ where: { id } }),
	removeWhere: (where: Prisma.SubmissionWhereInput) =>
		prisma.submission.deleteMany({ where }),
	createNote: (data: Prisma.SubmissionNoteCreateInput) =>
		prisma.submissionNote.create({
			data,
			include: {
				creator: true,
			},
		}),
};
