import { processEmailOutboxBatch } from "../src/server/email/outbox";

const parseTake = (value: string | undefined) => {
	if (!value) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const result = await processEmailOutboxBatch({
	take: parseTake(process.env.EMAIL_OUTBOX_BATCH_SIZE),
	workerId: process.env.EMAIL_OUTBOX_WORKER_ID,
});

console.log(JSON.stringify(result));
