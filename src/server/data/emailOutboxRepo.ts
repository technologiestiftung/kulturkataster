import { randomUUID } from "node:crypto";
import { prisma } from "@/server/prisma";
import type {
	EmailTemplateVariables,
	SendTemplatedEmailArgs,
} from "@/server/email/sendTemplatedEmail";

export type EmailOutboxStatus = "pending" | "sending" | "sent" | "failed";

export type EmailOutboxItem = {
	id: string;
	to: string;
	subject: string;
	templatePath: string;
	variables: EmailTemplateVariables;
	metadata: Record<string, unknown> | null;
	status: EmailOutboxStatus;
	attempts: number;
	maxAttempts: number;
	nextAttemptAt: Date;
	lockedAt: Date | null;
	lockedBy: string | null;
	lastError: string | null;
	providerMessageId: string | null;
	sentAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

type EmailOutboxRow = {
	id: string;
	to: string;
	subject: string;
	template_path: string;
	variables: unknown;
	metadata: unknown;
	status: EmailOutboxStatus;
	attempts: number;
	max_attempts: number;
	next_attempt_at: Date;
	locked_at: Date | null;
	locked_by: string | null;
	last_error: string | null;
	provider_message_id: string | null;
	sent_at: Date | null;
	created_at: Date;
	updated_at: Date;
};

export type EnqueueEmailInput = SendTemplatedEmailArgs & {
	metadata?: Record<string, unknown>;
	maxAttempts?: number;
	nextAttemptAt?: Date;
};

const toJson = (value: unknown) => JSON.stringify(value);

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const mapRow = (row: EmailOutboxRow): EmailOutboxItem => ({
	id: row.id,
	to: row.to,
	subject: row.subject,
	templatePath: row.template_path,
	variables: asRecord(row.variables) ?? {},
	metadata: asRecord(row.metadata),
	status: row.status,
	attempts: row.attempts,
	maxAttempts: row.max_attempts,
	nextAttemptAt: row.next_attempt_at,
	lockedAt: row.locked_at,
	lockedBy: row.locked_by,
	lastError: row.last_error,
	providerMessageId: row.provider_message_id,
	sentAt: row.sent_at,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const normalizeMaxAttempts = (value: number | undefined) => {
	if (!value || !Number.isFinite(value)) return 5;
	return Math.min(20, Math.max(1, Math.floor(value)));
};

export const emailOutboxRepo = {
	async enqueue(input: EnqueueEmailInput): Promise<EmailOutboxItem> {
		const recipient = input.to.trim();
		if (!recipient) {
			throw new Error("Cannot enqueue email without a recipient.");
		}

		const rows = await prisma.$queryRaw<EmailOutboxRow[]>`
			INSERT INTO "email_outbox" (
				"id",
				"to",
				"subject",
				"template_path",
				"variables",
				"metadata",
				"max_attempts",
				"next_attempt_at",
				"created_at",
				"updated_at"
			)
			VALUES (
				${randomUUID()},
				${recipient},
				${input.subject},
				${input.templatePath},
				${toJson(input.variables ?? {})}::jsonb,
				${toJson(input.metadata ?? null)}::jsonb,
				${normalizeMaxAttempts(input.maxAttempts)},
				${input.nextAttemptAt ?? new Date()},
				CURRENT_TIMESTAMP,
				CURRENT_TIMESTAMP
			)
			RETURNING *
		`;

		const row = rows[0];
		if (!row) {
			throw new Error("Email outbox insert did not return a row.");
		}
		return mapRow(row);
	},

	async claimNext(args: {
		workerId: string;
		lockTimeoutMs: number;
	}): Promise<EmailOutboxItem | null> {
		const staleBefore = new Date(Date.now() - args.lockTimeoutMs);
		const rows = await prisma.$queryRaw<EmailOutboxRow[]>`
			UPDATE "email_outbox"
			SET
				"status" = 'sending',
				"attempts" = "attempts" + 1,
				"locked_at" = CURRENT_TIMESTAMP,
				"locked_by" = ${args.workerId},
				"last_error" = NULL,
				"updated_at" = CURRENT_TIMESTAMP
			WHERE "id" = (
				SELECT "id"
				FROM "email_outbox"
				WHERE
					(
						"status" IN ('pending', 'failed')
						OR ("status" = 'sending' AND "locked_at" < ${staleBefore})
					)
					AND "attempts" < "max_attempts"
					AND "next_attempt_at" <= CURRENT_TIMESTAMP
				ORDER BY "created_at" ASC
				LIMIT 1
				FOR UPDATE SKIP LOCKED
			)
			RETURNING *
		`;

		return rows[0] ? mapRow(rows[0]) : null;
	},

	async markSent(args: {
		id: string;
		providerMessageId: string | null;
	}): Promise<void> {
		await prisma.$executeRaw`
			UPDATE "email_outbox"
			SET
				"status" = 'sent',
				"provider_message_id" = ${args.providerMessageId},
				"sent_at" = CURRENT_TIMESTAMP,
				"locked_at" = NULL,
				"locked_by" = NULL,
				"updated_at" = CURRENT_TIMESTAMP
			WHERE "id" = ${args.id}
		`;
	},

	async markFailed(args: {
		id: string;
		error: string;
		nextAttemptAt: Date;
	}): Promise<void> {
		await prisma.$executeRaw`
			UPDATE "email_outbox"
			SET
				"status" = 'failed',
				"last_error" = ${args.error},
				"next_attempt_at" = ${args.nextAttemptAt},
				"locked_at" = NULL,
				"locked_by" = NULL,
				"updated_at" = CURRENT_TIMESTAMP
			WHERE "id" = ${args.id}
		`;
	},
};
