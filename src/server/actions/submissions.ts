"use server";

import {
	Prisma,
	SubmissionEntityType,
	SubmissionStatus,
	SubmissionType,
} from "@/generated/prisma";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { submissionRepo } from "@/server/data/submissionRepo";
import {
	authorizeTable,
	getAccessContextForUser,
	getTableScope,
	requireScopeOrUser,
} from "@/server/utils/rbac";

type SubmissionFilter = {
	entityType?: SubmissionEntityType;
	entityId?: number | null;
	status?: SubmissionStatus;
	type?: SubmissionType;
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
	if (scope !== "all") {
		throw new Error("Only admins can review submissions.");
	}

	return submissionRepo.update(input.id, {
		status: input.status,
		review_notes: input.reviewNotes ?? undefined,
		reviewer: currentUserId ? { connect: { id: currentUserId } } : undefined,
		reviewed_at: new Date(),
	});
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
