"use server";

import {
	Prisma,
	SubmissionEntityType,
	SubmissionStatus,
	SubmissionType,
} from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { submissionRepo } from "@/server/data/submissionRepo";
import { prisma } from "@/server/prisma";
import {
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
	requireAllScope,
	requireScopeOrUser,
} from "@/server/utils/rbac";
import { revalidateAccount } from "@/server/utils/actionsUtils";
import { ClaimSubmissionDetail } from "@/types";

type SubmissionFilter = {
	entityType?: SubmissionEntityType;
	entityId?: number | null;
	status?: SubmissionStatus;
	type?: SubmissionType | Prisma.EnumSubmissionTypeFilter<"Submission">;
	createdBy?: string | null;
	reviewedBy?: string | null;
};

type SubmissionCreatePayload = {
	entityType: SubmissionEntityType;
	entityId?: number | null;
	type: SubmissionType;
	data: Prisma.InputJsonValue;
	diff?: Prisma.InputJsonValue | null;
	meta?: Prisma.InputJsonValue | null;
	status?: SubmissionStatus;
};

type SubmissionUpdatePayload = {
	id: number;
	data?: Prisma.InputJsonValue;
	diff?: Prisma.InputJsonValue | null;
	meta?: Prisma.InputJsonValue | null;
	status?: SubmissionStatus;
};

type SubmissionReviewPayload = {
	id: number;
	status: Exclude<SubmissionStatus, "draft">;
	reviewNotes?: string | null;
};

type ClaimReviewPayload = {
	id: number;
	decision: "approved" | "rejected";
	reviewNotes?: string | null;
};

export async function getSubmissions(filter: SubmissionFilter = {}) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");
	const scope = getTableScope(ctx, "submission", "read");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	const where: Prisma.SubmissionWhereInput = {
		entity_type: filter.entityType,
		entity_id: filter.entityId ?? undefined,
		status: filter.status,
		type: filter.type,
		created_by: ownerId ? ownerId : (filter.createdBy ?? undefined),
		reviewed_by: filter.reviewedBy ?? undefined,
	};

	return submissionRepo.list(where);
}

export async function getClaimSubmissionsDetailed(
	userId?: string,
): Promise<ClaimSubmissionDetail[]> {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");
	requireAllScope(ctx, "submission", "read");
	console.log("Getting claim submissions for userId:", userId);
	const submissions = await prisma.submission.findMany({
		where: { type: "claim", created_by: userId ?? undefined },
		orderBy: { created_at: "desc" },
		include: {
			creator: {
				include: {
					role: true,
					groups: true,
					institutions: true,
					submissions: true,
				},
			},
		},
	});

	const institutionIds = submissions
		.map((submission) => submission.entity_id)
		.filter((id): id is number => typeof id === "number");

	const institutions = institutionIds.length
		? await prisma.institution.findMany({
				where: { id: { in: institutionIds } },
				include: {
					address: true,
					users: true,
					groups: true,
					contact_person: true,
					categories: true,
					tags: true,
				},
			})
		: [];

	const institutionById = new Map(
		institutions.map((institution) => [institution.id, institution]),
	);

	return submissions.map((submission) => ({
		submission,
		institution:
			typeof submission.entity_id === "number"
				? (institutionById.get(submission.entity_id) ?? null)
				: null,
		claimant: submission.creator ?? null,
	}));
}

export async function getSubmissionById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");
	const scope = getTableScope(ctx, "submission", "read");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		return submissionRepo.findById(id);
	}
	return submissionRepo.findFirst({ id, created_by: ownerId });
}

export async function createSubmission(input: SubmissionCreatePayload) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "create");

	return submissionRepo.create({
		entity_type: input.entityType,
		entity_id: input.entityId ?? null,
		type: input.type,
		status: input.status ?? "draft",
		data: input.data,
		diff: input.diff ?? undefined,
		meta: input.meta ?? undefined,
		creator: currentUserId ? { connect: { id: currentUserId } } : undefined,
	});
}

export async function updateSubmission(input: SubmissionUpdatePayload) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	const scope = getTableScope(ctx, "submission", "update");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		return submissionRepo.update(input.id, {
			data: input.data ?? undefined,
			diff: input.diff ?? undefined,
			meta: input.meta ?? undefined,
			status: input.status ?? undefined,
		});
	}
	const existing = await submissionRepo.findFirst({
		id: input.id,
		created_by: ownerId,
	});
	if (!existing) {
		throw new Error("Not authorized to update this submission.");
	}
	if (existing.status && existing.status !== "draft") {
		throw new Error("Only draft submissions can be edited.");
	}
	const result = await submissionRepo.updateWhere(
		{ id: input.id, created_by: ownerId },
		{
			data: input.data ?? undefined,
			diff: input.diff ?? undefined,
			meta: input.meta ?? undefined,
			status: input.status ?? undefined,
		},
	);
	if (result.count === 0) {
		throw new Error("Not authorized to update this submission.");
	}
	return submissionRepo.findFirst({ id: input.id, created_by: ownerId });
}

export async function submitSubmission(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	const scope = getTableScope(ctx, "submission", "update");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		return submissionRepo.update(id, { status: "approval_pending" });
	}
	const result = await submissionRepo.updateWhere(
		{ id, created_by: ownerId },
		{ status: "approval_pending" },
	);
	if (result.count === 0) {
		throw new Error("Not authorized to submit this submission.");
	}
	return submissionRepo.findById(id);
}

export async function reviewSubmission(input: SubmissionReviewPayload) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	const scope = getTableScope(ctx, "submission", "update");
	const ownerId = requireScopeOrUser(scope, currentUserId);

	if (!ownerId) {
		return submissionRepo.update(input.id, {
			status: input.status,
			review_notes: input.reviewNotes ?? undefined,
			reviewer: currentUserId ? { connect: { id: currentUserId } } : undefined,
			reviewed_at: new Date(),
		});
	}

	const result = await submissionRepo.updateWhere(
		{ id: input.id, created_by: ownerId },
		{
			status: input.status,
			review_notes: input.reviewNotes ?? undefined,
			reviewer: currentUserId ? { connect: { id: currentUserId } } : undefined,
			reviewed_at: new Date(),
		},
	);
	if (result.count === 0) {
		throw new Error("Not authorized to review this submission.");
	}
	return submissionRepo.findFirst({ id: input.id, created_by: ownerId });
}

export async function reviewClaimSubmission(input: ClaimReviewPayload) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");
	requireAllScope(ctx, "submission", "update");

	const submission = await submissionRepo.findById(input.id);
	if (!submission) {
		throw new Error("Claim submission not found.");
	}
	if (submission.type !== "claim") {
		throw new Error("Submission is not a claim.");
	}
	if (input.decision === "rejected") {
		await submissionRepo.remove(input.id);
		revalidateAccount();
		return { id: input.id, status: "rejected" as const };
	}

	const entityId = submission.entity_id;
	const claimantId = submission.created_by;
	if (!entityId || !claimantId) {
		throw new Error("Claim submission missing entity or user.");
	}

	await prisma.institution.update({
		where: { id: entityId },
		data: { users: { connect: { id: claimantId } } },
	});

	await prisma.user.update({
		where: { id: claimantId },
		data: { institutions: { connect: { id: entityId } } },
	});

	const updated = await submissionRepo.update(input.id, {
		status: "approved",
		review_notes: input.reviewNotes ?? undefined,
		reviewer: currentUserId ? { connect: { id: currentUserId } } : undefined,
		reviewed_at: new Date(),
	});

	revalidateAccount();
	return updated;
}

export async function deleteSubmission(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "delete");
	const scope = getTableScope(ctx, "submission", "delete");
	const ownerId = requireScopeOrUser(scope, currentUserId);
	if (!ownerId) {
		await submissionRepo.remove(id);
		return { id };
	}
	const result = await submissionRepo.removeWhere({
		id,
		created_by: ownerId,
	});
	if (result.count === 0) {
		throw new Error("Not authorized to delete this submission.");
	}
	return { id };
}
