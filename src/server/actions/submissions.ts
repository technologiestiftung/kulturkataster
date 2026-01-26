"use server";

import {
	Prisma,
	SubmissionEntityType,
	SubmissionStatus,
	SubmissionType,
} from "@/generated/prisma";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";
import { submissionRepo } from "@/server/data/submissionRepo";
import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";

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

	const where: Prisma.SubmissionWhereInput = {
		entity_type: filter.entityType,
		entity_id: filter.entityId ?? undefined,
		status: filter.status,
		type: filter.type,
		created_by: filter.createdBy ?? undefined,
		reviewed_by: filter.reviewedBy ?? undefined,
	};

	return submissionRepo.list(where);
}

export async function getSubmissionById(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "read");

	return submissionRepo.findById(id);
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

	return submissionRepo.update(input.id, {
		data: input.data ?? undefined,
		diff: input.diff ?? undefined,
		meta: input.meta ?? undefined,
		status: input.status ?? undefined,
	});
}

export async function submitSubmission(id: number) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");

	return submissionRepo.update(id, {
		status: "approval_pending",
	});
}

export async function reviewSubmission(input: SubmissionReviewPayload) {
	const currentUserId = await getCurrentUserId();
	const ctx = await getAccessContextForUser(currentUserId);
	authorizeTable(ctx, "submission", "update");

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

	return submissionRepo.remove(id);
}
