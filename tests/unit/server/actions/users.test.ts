import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	authorizeTable,
	requireAllScope,
	getAccessContextForUser,
	getCurrentUserId,
	findById,
	update,
	sendRoleDecisionEmail,
	revalidateAccount,
	loggerError,
	listActiveCustom,
	findActiveByPath,
	sendTemplatedEmail,
} = vi.hoisted(() => ({
	authorizeTable: vi.fn(),
	requireAllScope: vi.fn(),
	getAccessContextForUser: vi.fn(),
	getCurrentUserId: vi.fn(),
	findById: vi.fn(),
	update: vi.fn(),
	sendRoleDecisionEmail: vi.fn(),
	revalidateAccount: vi.fn(),
	loggerError: vi.fn(),
	listActiveCustom: vi.fn(),
	findActiveByPath: vi.fn(),
	sendTemplatedEmail: vi.fn(),
}));

vi.mock("@/server/utils/rbac", () => ({
	authorizeTable,
	getAccessContextForUser,
	getTableScope: vi.fn(),
	requireAllScope,
	requireScopeOrUser: vi.fn(),
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId,
	requestPasswordReset: vi.fn(),
}));

vi.mock("@/server/data/userRepo", () => ({
	userRepo: {
		findById,
		update,
	},
}));

vi.mock("@/server/email/dispatcher", () => ({
	RoleEmailDecision: {
		approved: "approved",
		rejected: "rejected",
	},
	RoleEmailTarget: {
		district: "district",
		state: "state",
		network: "network",
	},
	sendAccountDeletedEmail: vi.fn(),
	sendComplianceResendEmail: vi.fn(),
	sendRoleDecisionEmail,
	sendRoleDecisionEmailIfNeeded: vi.fn(),
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		error: loggerError,
	},
}));

vi.mock("@/server/logging/requestContext", () => ({
	runWithServerRequestContext: async <T>(fn: () => Promise<T>): Promise<T> =>
		fn(),
	setRequestContext: vi.fn(),
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount,
}));

vi.mock("@/server/supabase/server", () => ({
	createAdminClient: vi.fn(),
	createClient: vi.fn(),
}));

vi.mock("@/server/data/emailTemplateRepo", () => ({
	emailTemplateRepo: {
		listActiveCustom,
		findActiveByPath,
	},
}));

vi.mock("@/server/email/sendTemplatedEmail", () => ({
	sendTemplatedEmail,
}));

import {
	getUserEmailTemplateOptions,
	sendRoleDecisionEmailManual,
	sendUserEmailTemplate,
} from "@/server/actions/users";

describe("server actions: users", () => {
	beforeEach(() => {
		authorizeTable.mockReset();
		requireAllScope.mockReset();
		getAccessContextForUser.mockReset();
		getCurrentUserId.mockReset();
		findById.mockReset();
		update.mockReset();
		sendRoleDecisionEmail.mockReset();
		revalidateAccount.mockReset();
		loggerError.mockReset();

		getCurrentUserId.mockResolvedValue("admin-1");
		getAccessContextForUser.mockResolvedValue({ role: "admin" });
	});

	it("sets the user status to active after an approved decision email is sent", async () => {
		findById.mockResolvedValue({
			id: "user-1",
			email: "person@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
			status: "approval_pending",
			meta_info: null,
		});
		update.mockResolvedValue({
			id: "user-1",
			email: "person@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
			status: "active",
			meta_info: null,
		});

		const result = await sendRoleDecisionEmailManual({
			userId: "user-1",
			target: "district",
			decision: "approved",
		});

		expect(sendRoleDecisionEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				target: "district",
				decision: "approved",
				email: "person@example.com",
			}),
		);
		expect(update).toHaveBeenCalledWith("user-1", { status: "active" });
		expect(result).toMatchObject({
			ok: true,
			data: expect.objectContaining({ status: "active" }),
		});
		expect(revalidateAccount).toHaveBeenCalledTimes(1);
	});

	it("does not change the user status for rejected decision emails", async () => {
		findById.mockResolvedValue({
			id: "user-1",
			email: "person@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
			status: "approval_pending",
			meta_info: null,
		});

		const result = await sendRoleDecisionEmailManual({
			userId: "user-1",
			target: "district",
			decision: "rejected",
		});

		expect(sendRoleDecisionEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				target: "district",
				decision: "rejected",
				email: "person@example.com",
			}),
		);
		expect(update).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			ok: true,
			data: expect.objectContaining({ status: "approval_pending" }),
		});
		expect(revalidateAccount).toHaveBeenCalledTimes(1);
	});
});

describe("getUserEmailTemplateOptions", () => {
	beforeEach(() => {
		getCurrentUserId.mockResolvedValue("admin-1");
		requireAllScope.mockResolvedValue(undefined);
		listActiveCustom.mockReset();
	});

	it("returns active custom templates", async () => {
		const templates = [
			{
				key: "custom.claim_approved",
				path: "custom/claim_approved.html",
				name: "Claim bestätigt",
				subject: null,
			},
			{
				key: "custom.submission_approved",
				path: "custom/submission_approved.html",
				name: "Einreichung bestätigt",
				subject: null,
			},
		];
		listActiveCustom.mockResolvedValue(templates);

		const result = await getUserEmailTemplateOptions();

		expect(result).toMatchObject({ ok: true, data: templates });
	});

	it("throws when unauthorized", async () => {
		requireAllScope.mockImplementation(() => {
			throw new Error("forbidden");
		});

		await expect(getUserEmailTemplateOptions()).rejects.toThrow("forbidden");
	});
});

describe("sendUserEmailTemplate", () => {
	const resolvedUser = {
		id: "user-1",
		email: "user@example.com",
		first_name: "Ada",
		last_name: "Lovelace",
		status: "active",
		meta_info: null,
	};

	beforeEach(() => {
		getCurrentUserId.mockResolvedValue("admin-1");
		requireAllScope.mockResolvedValue(undefined);
		findById.mockResolvedValue(resolvedUser);
		findActiveByPath.mockReset();
		sendTemplatedEmail.mockReset();
	});

	it("sends the email when template and user exist", async () => {
		findActiveByPath.mockResolvedValue({
			key: "custom.claim_approved",
			path: "custom/claim_approved.html",
			name: "Claim bestätigt",
			subject: "Ihr Claim wurde bestätigt",
		});
		sendTemplatedEmail.mockResolvedValue(undefined);

		const result = await sendUserEmailTemplate({
			userId: "user-1",
			templatePath: "custom/claim_approved.html",
		});

		expect(sendTemplatedEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "user@example.com",
				templatePath: "custom/claim_approved.html",
			}),
		);
		expect(result).toMatchObject({ ok: true });
	});

	it("returns not-found when the template does not exist", async () => {
		findActiveByPath.mockResolvedValue(null);

		const result = await sendUserEmailTemplate({
			userId: "user-1",
			templatePath: "custom/nonexistent.html",
		});

		expect(sendTemplatedEmail).not.toHaveBeenCalled();
		expect(result).toMatchObject({ ok: false });
	});

	it("returns not-found when the user does not exist", async () => {
		findById.mockResolvedValue(null);
		findActiveByPath.mockResolvedValue({
			key: "custom.claim_approved",
			path: "custom/claim_approved.html",
			name: "Claim bestätigt",
			subject: null,
		});

		const result = await sendUserEmailTemplate({
			userId: "user-1",
			templatePath: "custom/claim_approved.html",
		});

		expect(sendTemplatedEmail).not.toHaveBeenCalled();
		expect(result).toMatchObject({ ok: false });
	});
});
