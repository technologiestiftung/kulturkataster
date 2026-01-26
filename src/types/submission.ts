import type { Prisma } from "@/generated/prisma";

export type Submission =
	Prisma.SubmissionGetPayload<Prisma.SubmissionDefaultArgs>;
export type SubmissionCreateInput = Prisma.SubmissionCreateInput;
export type SubmissionUpdateInput = Prisma.SubmissionUpdateInput;
export type SubmissionWhereInput = Prisma.SubmissionWhereInput;
