import type {
	ActivityStatus,
	Prisma,
	SubmissionEntityType,
	SubmissionStatus,
	SubmissionType,
} from "@/generated/prisma";
import type { Institution } from "@/types/institution";
import type { User } from "@/types/user";

export type SubmissionNote = Prisma.SubmissionNoteGetPayload<{
	include: {
		creator: true;
	};
}>;

export type Submission = Prisma.SubmissionGetPayload<{
	include: {
		notes: {
			include: {
				creator: true;
			};
		};
	};
}>;

export type ClaimSubmission = Prisma.SubmissionGetPayload<{
	include: {
		notes: {
			include: {
				creator: true;
			};
		};
		creator: {
			include: {
				role: {
					include: {
						table_permissions: true;
					};
				};
				groups: true;
				institutions: true;
				submissions: true;
			};
		};
	};
}>;
export type SubmissionCreateInput = Prisma.SubmissionCreateInput;
export type SubmissionUpdateInput = Prisma.SubmissionUpdateInput;
export type SubmissionWhereInput = Prisma.SubmissionWhereInput;

export type ClaimSubmissionDetail = {
	submission: ClaimSubmission;
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

export type SubmissionFilter = {
	entityType?: SubmissionEntityType;
	entityId?: number | null;
	status?: SubmissionStatus;
	type?: SubmissionType | Prisma.EnumSubmissionTypeFilter<"Submission">;
	createdBy?: string | null;
	reviewedBy?: string | null;
};

export type SubmissionCreatePayload = {
	entityType: SubmissionEntityType;
	entityId?: number | null;
	type: SubmissionType;
	data: Prisma.InputJsonValue | null;
	diff?: Prisma.InputJsonValue | null;
	meta?: Prisma.InputJsonValue | null;
	status?: SubmissionStatus;
};

export type SubmissionUpdatePayload = {
	id: number;
	data?: Prisma.InputJsonValue | null;
	diff?: Prisma.InputJsonValue | null;
	meta?: Prisma.InputJsonValue | null;
	status?: SubmissionStatus;
};

export type SubmissionReviewPayload = {
	id: number;
	status: Exclude<SubmissionStatus, "draft">;
	internalNotes?: string | null;
	grantSubmitterAccess?: boolean;
};

export type SubmissionNoteCreatePayload = {
	submissionId: number;
	note: string;
};

export type ClaimReviewPayload = {
	id: number;
	decision: "approved" | "rejected";
	reviewNotes?: string | null;
};

export type SubmissionAuditStatusUpdateInput = {
	submissionId: number;
	status: ActivityStatus;
	reviewerId: string | null;
	reviewNotes?: string | null;
};
