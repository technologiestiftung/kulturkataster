import type { Prisma } from "@/generated/prisma";

export type Submission =
	Prisma.SubmissionGetPayload<Prisma.SubmissionDefaultArgs>;
export type SubmissionCreateInput = Prisma.SubmissionCreateInput;
export type SubmissionUpdateInput = Prisma.SubmissionUpdateInput;
export type SubmissionWhereInput = Prisma.SubmissionWhereInput;

export type InstitutionDraftData = Record<string, unknown>;

export type InstitutionDraftStoreState = {
	draft: InstitutionDraftData;
	stepId: string;
	mode: "create" | "update";
	setDraft: (partial: InstitutionDraftData) => void;
	setStepId: (stepId: string) => void;
	setMode: (mode: "create" | "update") => void;
	resetDraft: () => void;
};
