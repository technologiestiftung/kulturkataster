import { beforeEach, describe, expect, it, vi } from "vitest";

const { enqueueTemplatedEmail, processEmailOutboxBatch, loggerError } =
	vi.hoisted(() => ({
		enqueueTemplatedEmail: vi.fn(),
		processEmailOutboxBatch: vi.fn(),
		loggerError: vi.fn(),
	}));

vi.mock("@/server/email/outbox", () => ({
	enqueueTemplatedEmail,
	processEmailOutboxBatch,
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		error: loggerError,
	},
}));

import {
	sendClaimDecisionEmail,
	sendComplianceResendEmail,
	sendInstitutionDownloadNotificationEmail,
} from "@/server/email/dispatcher";

describe("email dispatcher", () => {
	beforeEach(() => {
		enqueueTemplatedEmail.mockReset();
		processEmailOutboxBatch.mockReset();
		loggerError.mockReset();
		process.env.SITE_URL = "https://example.test";
	});

	it("queues claim decision emails instead of sending directly", async () => {
		enqueueTemplatedEmail.mockResolvedValue({ id: "email-1" });

		await sendClaimDecisionEmail({
			decision: "approved",
			email: "person@example.com",
			firstName: "Ada",
			lastName: "Lovelace",
			institutionName: "Die Etage",
		});

		expect(enqueueTemplatedEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "person@example.com",
				templatePath: "custom/claim_approved.html",
				variables: expect.objectContaining({
					Email: "person@example.com",
					SiteURL: "https://example.test",
				}),
			}),
		);
	});

	it("throws when a must-not-lose email cannot be queued", async () => {
		const error = new Error("database unavailable");
		enqueueTemplatedEmail.mockRejectedValue(error);

		await expect(
			sendInstitutionDownloadNotificationEmail({
				to: "admin@example.com",
				requesterEmail: "user@example.com",
				filename: "export",
				format: "xlsx",
				institutionCount: 1,
				institutionIds: [1],
			}),
		).rejects.toThrow("database unavailable");
		expect(loggerError).toHaveBeenCalledWith(
			"email.institution_download_notification.enqueue_failed",
			error,
			expect.objectContaining({
				subsystem: "email",
				email_to: "admin@example.com",
			}),
		);
	});

	it("attempts download notification delivery immediately after queueing", async () => {
		enqueueTemplatedEmail.mockResolvedValue({ id: "email-1" });
		processEmailOutboxBatch.mockResolvedValue({
			claimed: 1,
			sent: 1,
			failed: 0,
		});

		await sendInstitutionDownloadNotificationEmail({
			to: "admin@example.com",
			requesterEmail: "user@example.com",
			filename: "export",
			format: "xlsx",
			institutionCount: 1,
			institutionIds: [1],
		});

		expect(processEmailOutboxBatch).toHaveBeenCalledWith({
			take: 1,
			workerId: expect.stringMatching(/^email-request-/),
		});
	});

	it("keeps compliance resend failures visible to callers", async () => {
		enqueueTemplatedEmail.mockRejectedValue(new Error("outbox failed"));

		await expect(
			sendComplianceResendEmail({ email: "person@example.com" }),
		).rejects.toThrow("outbox failed");
	});
});
