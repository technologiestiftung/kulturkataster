import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyInstitutionDownload } from "@/server/actions/downloads";

const {
	getCurrentUserMock,
	getCurrentProfileMock,
	sendInstitutionDownloadNotificationEmailMock,
	entityAuditCreateMock,
	loggerErrorMock,
	setRequestContextMock,
} = vi.hoisted(() => ({
	getCurrentUserMock: vi.fn(),
	getCurrentProfileMock: vi.fn(),
	sendInstitutionDownloadNotificationEmailMock: vi.fn(),
	entityAuditCreateMock: vi.fn(),
	loggerErrorMock: vi.fn(),
	setRequestContextMock: vi.fn(),
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUser: getCurrentUserMock,
	getCurrentProfile: getCurrentProfileMock,
}));

vi.mock("@/server/email/dispatcher", () => ({
	sendInstitutionDownloadNotificationEmail:
		sendInstitutionDownloadNotificationEmailMock,
}));

vi.mock("@/server/prisma", () => ({
	prisma: {
		entityAudit: {
			create: entityAuditCreateMock,
		},
	},
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		error: loggerErrorMock,
	},
}));

vi.mock("@/server/logging/requestContext", () => ({
	runWithServerRequestContext: async <T>(fn: () => Promise<T>): Promise<T> =>
		fn(),
	setRequestContext: setRequestContextMock,
}));

describe("notifyInstitutionDownload", () => {
	beforeEach(() => {
		getCurrentUserMock.mockReset();
		getCurrentProfileMock.mockReset();
		sendInstitutionDownloadNotificationEmailMock.mockReset();
		entityAuditCreateMock.mockReset();
		loggerErrorMock.mockReset();
		setRequestContextMock.mockReset();
	});

	it("sends an admin notification with requester and export details", async () => {
		getCurrentUserMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
		});
		getCurrentProfileMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
		});

		const result = await notifyInstitutionDownload({
			filename: "kulturorte",
			format: "xlsx",
			institutionCount: 3,
			institutionIds: [11, 22, 33],
		});

		expect(result).toEqual({ ok: true });
		expect(setRequestContextMock).toHaveBeenCalledWith({ userId: "user-1" });
		expect(entityAuditCreateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					entity_id: "user-1",
					entity_type: "user",
					action: "update",
					status: "completed",
					changed_by: "user-1",
				}),
			}),
		);
		expect(sendInstitutionDownloadNotificationEmailMock).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "info@kulturkataster.berlin",
				requesterEmail: "user@example.com",
				requesterFirstName: "Ada",
				requesterLastName: "Lovelace",
				filename: "kulturorte",
				format: "xlsx",
				institutionCount: 3,
				institutionIds: [11, 22, 33],
				usagePurpose: undefined,
			}),
		);
	});

	it("does not throw when the notification email fails", async () => {
		getCurrentUserMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
		});
		getCurrentProfileMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
		});
		sendInstitutionDownloadNotificationEmailMock.mockRejectedValue(
			new Error("smtp failed"),
		);

		const result = await notifyInstitutionDownload({
			filename: "kulturorte",
			format: "xlsx",
			institutionCount: 1,
			institutionIds: [99],
		});

		expect(result).toEqual({ ok: true });
		expect(loggerErrorMock).toHaveBeenCalledWith(
			"download.institution_notification.failed",
			expect.any(Error),
			expect.objectContaining({
				actor_user_id: "user-1",
				email_to: "info@kulturkataster.berlin",
			}),
		);
	});

	it("does not throw when the audit log write fails", async () => {
		getCurrentUserMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
		});
		getCurrentProfileMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
		});
		entityAuditCreateMock.mockRejectedValue(new Error("db failed"));

		const result = await notifyInstitutionDownload({
			filename: "kulturorte",
			format: "xlsx",
			institutionCount: 1,
			institutionIds: [99],
		});

		expect(result).toEqual({ ok: true });
		expect(loggerErrorMock).toHaveBeenCalledWith(
			"download.institution_audit.failed",
			expect.any(Error),
			expect.objectContaining({
				actor_user_id: "user-1",
			}),
		);
		expect(sendInstitutionDownloadNotificationEmailMock).toHaveBeenCalled();
	});

	it("supports guest downloads without an authenticated user", async () => {
		getCurrentUserMock.mockResolvedValue(null);
		getCurrentProfileMock.mockResolvedValue(null);

		const result = await notifyInstitutionDownload({
			filename: "kulturorte",
			format: "xlsx",
			institutionCount: 2,
			institutionIds: [1, 2],
			requesterFirstName: "Guest",
			requesterLastName: "User",
			requesterEmail: "guest@example.com",
			usagePurpose: "Research",
		});

		expect(result).toEqual({ ok: true });
		expect(entityAuditCreateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					entity_id: "guest@example.com",
					changed_by: null,
				}),
			}),
		);
		expect(sendInstitutionDownloadNotificationEmailMock).toHaveBeenCalledWith(
			expect.objectContaining({
				requesterEmail: "guest@example.com",
				usagePurpose: "Research",
			}),
		);
	});
});
