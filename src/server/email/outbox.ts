import { randomUUID } from "node:crypto";
import {
	emailOutboxRepo,
	type EmailOutboxItem,
	type EnqueueEmailInput,
} from "@/server/data/emailOutboxRepo";
import { logger } from "@/server/logging/logger";
import { sendTemplatedEmail } from "@/server/email/sendTemplatedEmail";

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const AUTO_DRAIN_BATCH_SIZE = 10;
const MAX_BACKOFF_MS = 60 * 60 * 1000;

let autoDrainScheduled = false;

export const enqueueTemplatedEmail = async (input: EnqueueEmailInput) => {
	const item = await emailOutboxRepo.enqueue(input);
	scheduleEmailOutboxDrain();
	return item;
};

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

const getNextAttemptAt = (attempts: number) => {
	const backoffMs = Math.min(
		MAX_BACKOFF_MS,
		60_000 * 2 ** Math.max(0, attempts - 1),
	);
	return new Date(Date.now() + backoffMs);
};

const sendOutboxItem = async (item: EmailOutboxItem) => {
	const result = await sendTemplatedEmail({
		to: item.to,
		subject: item.subject,
		templatePath: item.templatePath,
		variables: item.variables,
	});
	await emailOutboxRepo.markAccepted({
		id: item.id,
		providerMessageId: result.id,
		providerResponse: result.response,
	});
	logger.info("email.outbox.accepted", {
		subsystem: "email",
		email_outbox_id: item.id,
		email_to: item.to,
		template: item.templatePath,
		attempts: item.attempts,
		provider_message_id: result.id,
		smtp_accepted_count: result.accepted?.length,
		smtp_rejected_count: result.rejected?.length,
		smtp_pending_count: result.pending?.length,
	});
};

export const scheduleEmailOutboxDrain = () => {
	if (autoDrainScheduled) return;
	autoDrainScheduled = true;

	setTimeout(() => {
		void processEmailOutboxBatch({
			take: AUTO_DRAIN_BATCH_SIZE,
			workerId: `email-auto-${process.pid}`,
		})
			.catch((error) => {
				logger.error("email.outbox.auto_drain_failed", error, {
					subsystem: "email",
				});
			})
			.finally(() => {
				autoDrainScheduled = false;
			});
	}, 0);
};

export async function processEmailOutboxBatch(
	options: {
		take?: number;
		workerId?: string;
		lockTimeoutMs?: number;
	} = {},
) {
	const take = Math.max(
		1,
		Math.min(100, Math.floor(options.take ?? DEFAULT_BATCH_SIZE)),
	);
	const workerId = options.workerId ?? `email-worker-${randomUUID()}`;
	const lockTimeoutMs = options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS;
	let accepted = 0;
	let failed = 0;
	let claimed = 0;

	for (let index = 0; index < take; index += 1) {
		const item = await emailOutboxRepo.claimNext({
			workerId,
			lockTimeoutMs,
		});
		if (!item) break;
		claimed += 1;

		try {
			await sendOutboxItem(item);
			accepted += 1;
		} catch (error) {
			failed += 1;
			const errorMessage = getErrorMessage(error);
			await emailOutboxRepo.markFailed({
				id: item.id,
				error: errorMessage,
				nextAttemptAt: getNextAttemptAt(item.attempts),
			});
			logger.error("email.outbox.send_failed", error, {
				subsystem: "email",
				email_outbox_id: item.id,
				email_to: item.to,
				template: item.templatePath,
				attempts: item.attempts,
				max_attempts: item.maxAttempts,
			});
		}
	}

	return {
		claimed,
		accepted,
		failed,
	};
}
