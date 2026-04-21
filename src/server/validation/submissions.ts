import {
	SubmissionEntityType,
	SubmissionStatus,
	SubmissionType,
} from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import type {
	ClaimReviewPayload,
	SubmissionCreatePayload,
	SubmissionNoteCreatePayload,
	SubmissionReviewPayload,
	SubmissionUpdatePayload,
} from "@/types/submission";
import {
	optionalTextSchema,
	parseWithSchema,
	positiveIntegerSchema,
	z,
} from "./common";

const submissionStatusSchema = z.nativeEnum(SubmissionStatus);

const submissionCreateSchema = z
	.object({
		entityType: z.nativeEnum(SubmissionEntityType),
		entityId: positiveIntegerSchema("Submission entity id must be positive.")
			.nullable()
			.optional(),
		type: z.nativeEnum(SubmissionType),
		data: z
			.unknown()
			.nullable()
			.transform((value) => value as Prisma.InputJsonValue | null),
		diff: z
			.unknown()
			.nullable()
			.optional()
			.transform((value) => value as Prisma.InputJsonValue | null | undefined),
		meta: z
			.unknown()
			.nullable()
			.optional()
			.transform((value) => value as Prisma.InputJsonValue | null | undefined),
		status: submissionStatusSchema.optional(),
	})
	.transform((value): SubmissionCreatePayload => value);

const submissionUpdateSchema = z
	.object({
		id: positiveIntegerSchema("Submission id must be positive."),
		data: z
			.unknown()
			.nullable()
			.optional()
			.transform((value) => value as Prisma.InputJsonValue | null | undefined),
		diff: z
			.unknown()
			.nullable()
			.optional()
			.transform((value) => value as Prisma.InputJsonValue | null | undefined),
		meta: z
			.unknown()
			.nullable()
			.optional()
			.transform((value) => value as Prisma.InputJsonValue | null | undefined),
		status: submissionStatusSchema.optional(),
	})
	.transform((value): SubmissionUpdatePayload => value);

const submissionReviewSchema = z
	.object({
		id: positiveIntegerSchema("Submission id must be positive."),
		status: submissionStatusSchema.refine((value) => value !== "draft", {
			message: "Draft submissions cannot be reviewed.",
		}),
		internalNotes: optionalTextSchema().transform((value) => value ?? null),
		grantSubmitterAccess: z.boolean().optional().default(false),
		attachUserIds: z.array(z.string().uuid()).optional().default([]),
		attachGroupIds: z
			.array(positiveIntegerSchema("Group id must be positive."))
			.optional()
			.default([]),
	})
	.transform((value): SubmissionReviewPayload => value);

const submissionNoteCreateSchema = z
	.object({
		submissionId: positiveIntegerSchema("Submission id must be positive."),
		note: z.string().trim().min(1, "Submission note must not be empty."),
	})
	.transform((value): SubmissionNoteCreatePayload => value);

const claimReviewSchema = z
	.object({
		id: positiveIntegerSchema("Submission id must be positive."),
		decision: z.enum(["approved", "rejected"]),
		reviewNotes: optionalTextSchema().transform((value) => value ?? null),
	})
	.transform((value): ClaimReviewPayload => value);

export const validateSubmissionCreateInput = (input: SubmissionCreatePayload) =>
	parseWithSchema(submissionCreateSchema, input);

export const validateSubmissionUpdateInput = (input: SubmissionUpdatePayload) =>
	parseWithSchema(submissionUpdateSchema, input);

export const validateSubmissionReviewInput = (input: SubmissionReviewPayload) =>
	parseWithSchema(submissionReviewSchema, input);

export const validateSubmissionNoteCreateInput = (
	input: SubmissionNoteCreatePayload,
) => parseWithSchema(submissionNoteCreateSchema, input);

export const validateClaimReviewInput = (input: ClaimReviewPayload) =>
	parseWithSchema(claimReviewSchema, input);

export const validateSubmissionId = (id: number) =>
	parseWithSchema(positiveIntegerSchema("Submission id must be positive."), id);
