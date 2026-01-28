import type { Prisma } from "@/generated/prisma";

export type Submission =
	Prisma.SubmissionGetPayload<Prisma.SubmissionDefaultArgs>;
export type SubmissionCreateInput = Prisma.SubmissionCreateInput;
export type SubmissionUpdateInput = Prisma.SubmissionUpdateInput;
export type SubmissionWhereInput = Prisma.SubmissionWhereInput;

export type SubmissionDraft = Record<string, unknown>;

export type SubmissionStoreState = {
	draft: SubmissionDraft;
	stepId: string;
	setDraft: (partial: SubmissionDraft) => void;
	setStepId: (stepId: string) => void;
	resetDraft: () => void;
};
