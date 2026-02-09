import type { Prisma } from "@/generated/prisma";
import type { Institution } from "@/types/institution";
import type { User } from "@/types/user";

export type Submission =
	Prisma.SubmissionGetPayload<Prisma.SubmissionDefaultArgs>;
export type SubmissionCreateInput = Prisma.SubmissionCreateInput;
export type SubmissionUpdateInput = Prisma.SubmissionUpdateInput;
export type SubmissionWhereInput = Prisma.SubmissionWhereInput;

export type ClaimSubmissionDetail = {
	submission: Submission;
	institution: Institution | null;
	claimant: User | null;
};

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
