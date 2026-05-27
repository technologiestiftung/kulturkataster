import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	claimNext,
	enqueue,
	markSent,
	markFailed,
	sendTemplatedEmail,
	loggerInfo,
	loggerError,
} = vi.hoisted(() => ({
	claimNext: vi.fn(),
	enqueue: vi.fn(),
	markSent: vi.fn(),
	markFailed: vi.fn(),
	sendTemplatedEmail: vi.fn(),
	loggerInfo: vi.fn(),
	loggerError: vi.fn(),
}));

vi.mock("@/server/data/emailOutboxRepo", () => ({
	emailOutboxRepo: {
		enqueue,
		claimNext,
		markSent,
		markFailed,
	},
}));

vi.mock("@/server/email/sendTemplatedEmail", () => ({
	sendTemplatedEmail,
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		info: loggerInfo,
		error: loggerError,
	},
}));

import {
	enqueueTemplatedEmail,
	processEmailOutboxBatch,
} from "@/server/email/outbox";

const makeItem = (id: string) => ({
	id,
	to: "person@example.com",
	subject: "Subject",
	templatePath: "custom/example.html",
	variables: { Email: "person@example.com" },
	metadata: null,
	status: "sending" as const,
	attempts: 1,
	maxAttempts: 5,
	nextAttemptAt: new Date("2026-01-01T10:00:00Z"),
	lockedAt: new Date("2026-01-01T10:00:00Z"),
	lockedBy: "worker-1",
	lastError: null,
	providerMessageId: null,
	sentAt: null,
	createdAt: new Date("2026-01-01T10:00:00Z"),
	updatedAt: new Date("2026-01-01T10:00:00Z"),
});

describe("processEmailOutboxBatch", () => {
	beforeEach(() => {
		claimNext.mockReset();
		enqueue.mockReset();
		markSent.mockReset();
		markFailed.mockReset();
		sendTemplatedEmail.mockReset();
		loggerInfo.mockReset();
		loggerError.mockReset();
		vi.useRealTimers();
	});

	it("sends claimed outbox rows and marks them sent", async () => {
		claimNext
			.mockResolvedValueOnce(makeItem("email-1"))
			.mockResolvedValue(null);
		sendTemplatedEmail.mockResolvedValue({ id: "smtp-1" });

		const result = await processEmailOutboxBatch({
			take: 5,
			workerId: "worker-1",
		});

		expect(sendTemplatedEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "person@example.com",
				templatePath: "custom/example.html",
			}),
		);
		expect(markSent).toHaveBeenCalledWith({
			id: "email-1",
			providerMessageId: "smtp-1",
		});
		expect(result).toEqual({ claimed: 1, sent: 1, failed: 0 });
	});

	it("records delivery failures for retry", async () => {
		const error = new Error("smtp down");
		claimNext
			.mockResolvedValueOnce(makeItem("email-1"))
			.mockResolvedValue(null);
		sendTemplatedEmail.mockRejectedValue(error);

		const result = await processEmailOutboxBatch({
			take: 1,
			workerId: "worker-1",
		});

		expect(markFailed).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "email-1",
				error: "smtp down",
				nextAttemptAt: expect.any(Date),
			}),
		);
		expect(loggerError).toHaveBeenCalledWith(
			"email.outbox.send_failed",
			error,
			expect.objectContaining({
				email_outbox_id: "email-1",
				attempts: 1,
			}),
		);
		expect(result).toEqual({ claimed: 1, sent: 0, failed: 1 });
	});

	it("schedules a non-blocking drain after enqueue", async () => {
		vi.useFakeTimers();
		enqueue.mockResolvedValue(makeItem("email-1"));
		claimNext.mockResolvedValue(null);

		await enqueueTemplatedEmail({
			to: "person@example.com",
			subject: "Subject",
			templatePath: "custom/example.html",
			variables: { Email: "person@example.com" },
		});

		expect(claimNext).not.toHaveBeenCalled();
		await vi.runOnlyPendingTimersAsync();

		expect(claimNext).toHaveBeenCalledWith(
			expect.objectContaining({
				workerId: expect.stringMatching(/^email-auto-/),
			}),
		);
	});
});
