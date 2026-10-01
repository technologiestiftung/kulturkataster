import { submissionRepo } from "@/server/data/submissionRepo";
import { logger } from "@/server/logging/logger";
import {
	runWithServerRequestContext,
	setRequestContext,
} from "@/server/logging/requestContext";
import { authorizeTable, getAccessContextForUser } from "@/server/utils/rbac";
import { validateSubmissionCreateInput } from "@/server/validation/submissions";
import { stripUnreadableCultureIndex } from "@/server/logic/submissionCultureIndex";
import {
	normalizeOptionalSubmissionJson,
	normalizeSubmissionJson,
} from "@/lib/utils/submissionJsonUtils";
import type { SubmissionCreatePayload } from "@/types/submission";

const getSubmissionCreateLogContext = (
	input: Partial<SubmissionCreatePayload>,
	currentUserId?: string | null,
) => ({
	subsystem: "submission",
	actor_user_id: currentUserId ?? null,
	entity_type: input.entityType ?? null,
	entity_id: input.entityId ?? null,
	submission_type: input.type ?? null,
	has_data: input.data !== undefined && input.data !== null,
	has_diff: input.diff !== undefined && input.diff !== null,
	has_meta: input.meta !== undefined && input.meta !== null,
});

// Creates a submission as `currentUserId` (null = guest). Plain server module,
// not a server action: the calling server actions resolve the user and do their
// own gating (e.g. the guest captcha) first.
export async function createSubmissionAsUser(
	input: SubmissionCreatePayload,
	currentUserId: string | null,
) {
	return runWithServerRequestContext(
		async () => {
			let validatedInput: SubmissionCreatePayload | undefined;
			try {
				validatedInput = validateSubmissionCreateInput(input);
				setRequestContext({ userId: currentUserId });
				const ctx = await getAccessContextForUser(currentUserId);
				authorizeTable(ctx, "submission", "create");
				validatedInput = stripUnreadableCultureIndex(ctx, validatedInput);

				const nextStatus = "approval_pending";

				if (currentUserId && typeof validatedInput.entityId === "number") {
					const existingPending = await submissionRepo.findFirst({
						entity_type: validatedInput.entityType,
						entity_id: validatedInput.entityId,
						type: validatedInput.type,
						status: "approval_pending",
						created_by: currentUserId,
					});
					if (existingPending) {
						throw new Error(
							"You already have a pending submission for this entity and submission type.",
						);
					}
				}

				return await submissionRepo.create({
					entity_type: validatedInput.entityType,
					entity_id: validatedInput.entityId ?? null,
					type: validatedInput.type,
					status: nextStatus,
					data: normalizeSubmissionJson(validatedInput.data),
					diff: normalizeOptionalSubmissionJson(validatedInput.diff),
					meta: normalizeOptionalSubmissionJson(validatedInput.meta),
					creator: currentUserId
						? { connect: { id: currentUserId } }
						: undefined,
				});
			} catch (error) {
				logger.error(
					"submission.create.failed",
					error,
					getSubmissionCreateLogContext(validatedInput ?? input, currentUserId),
				);
				throw error;
			}
		},
		{ route: "server_action:submissions.createSubmission" },
	);
}
