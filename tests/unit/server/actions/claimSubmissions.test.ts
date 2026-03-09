import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getClaimSubmissionsDetailed,
	reviewClaimSubmission,
} from "@/server/actions/submissions";
import { SubmissionStatus } from "@/generated/prisma";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("admin-1"),
}));

const requireAllScopeMock = vi.fn();
const getTableScopeMock = vi.fn();
const getScopeUserIdMock = vi.fn();
const createNoAccessWhereMock = vi.fn();

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			submission: {
				name: new Set(["read", "update"]),
			},
		},
	}),
	authorizeTable: vi.fn(),
	requireAllScope: (...args: unknown[]) => requireAllScopeMock(...args),
	getTableScope: (...args: unknown[]) => getTableScopeMock(...args),
	getScopeUserId: (...args: unknown[]) => getScopeUserIdMock(...args),
	createNoAccessWhere: (...args: unknown[]) => createNoAccessWhereMock(...args),
	requireScopeOrUser: vi.fn(),
}));

const submissionFindByIdMock = vi.fn();

vi.mock("@/server/data/submissionRepo", () => ({
	submissionRepo: {
		findById: (id: number) => submissionFindByIdMock(id),
	},
}));

const prismaSubmissionFindManyMock = vi.fn();
const prismaInstitutionFindManyMock = vi.fn();
const prismaInstitutionFindFirstMock = vi.fn();
const prismaInstitutionFindUniqueMock = vi.fn();
const prismaUserFindUniqueMock = vi.fn();
const prismaTransactionMock = vi.fn();
const txSubmissionDeleteMock = vi.fn();
const txSubmissionUpdateMock = vi.fn();
const txInstitutionUpdateMock = vi.fn();
const txUserUpdateMock = vi.fn();

vi.mock("@/server/prisma", () => ({
	prisma: {
		$transaction: (...args: unknown[]) => prismaTransactionMock(...args),
		submission: {
			findMany: (args: unknown) => prismaSubmissionFindManyMock(args),
		},
		institution: {
			findMany: (args: unknown) => prismaInstitutionFindManyMock(args),
			findFirst: (args: unknown) => prismaInstitutionFindFirstMock(args),
			findUnique: (args: unknown) => prismaInstitutionFindUniqueMock(args),
		},
		user: {
			findUnique: (args: unknown) => prismaUserFindUniqueMock(args),
		},
	},
}));

const sendClaimDecisionEmailMock = vi.fn();
const sendSubmissionDecisionEmailMock = vi.fn();
vi.mock("@/server/email/dispatcher", () => ({
	sendClaimDecisionEmail: (...args: unknown[]) =>
		sendClaimDecisionEmailMock(...args),
	sendSubmissionDecisionEmail: (...args: unknown[]) =>
		sendSubmissionDecisionEmailMock(...args),
}));

const updateSubmissionAuditStatusMock = vi.fn();
vi.mock("@/server/logic/submissionAudit", () => ({
	updateSubmissionAuditStatus: (...args: unknown[]) =>
		updateSubmissionAuditStatusMock(...args),
}));

const revalidateAccountMock = vi.fn();
vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: () => revalidateAccountMock(),
}));

describe("server actions: claim submissions", () => {
	beforeEach(() => {
		requireAllScopeMock.mockReset();
		getTableScopeMock.mockReset();
		getScopeUserIdMock.mockReset();
		createNoAccessWhereMock.mockReset();
		submissionFindByIdMock.mockReset();
		prismaSubmissionFindManyMock.mockReset();
		prismaInstitutionFindManyMock.mockReset();
		prismaInstitutionFindFirstMock.mockReset();
		prismaInstitutionFindUniqueMock.mockReset();
		prismaUserFindUniqueMock.mockReset();
		prismaTransactionMock.mockReset();
		txSubmissionDeleteMock.mockReset();
		txSubmissionUpdateMock.mockReset();
		txInstitutionUpdateMock.mockReset();
		txUserUpdateMock.mockReset();
		updateSubmissionAuditStatusMock.mockReset();
		revalidateAccountMock.mockReset();
		sendClaimDecisionEmailMock.mockReset();
		sendSubmissionDecisionEmailMock.mockReset();

		getTableScopeMock.mockReturnValue("all");
		getScopeUserIdMock.mockImplementation((scope: string, userId: string) =>
			scope === "own" ? userId : null,
		);
		createNoAccessWhereMock.mockImplementation((baseWhere: unknown) => ({
			AND: [baseWhere, { id: -1 }],
		}));
		prismaInstitutionFindFirstMock.mockResolvedValue({ id: 1 });
		prismaInstitutionFindUniqueMock.mockResolvedValue({
			name: "Institution A",
		});
		prismaUserFindUniqueMock.mockResolvedValue({
			email: "claimant@example.com",
			first_name: "Ada",
			last_name: "Lovelace",
		});
		sendClaimDecisionEmailMock.mockResolvedValue(undefined);
		sendSubmissionDecisionEmailMock.mockResolvedValue(undefined);
		prismaTransactionMock.mockImplementation(async (callback: unknown) =>
			(callback as (tx: unknown) => Promise<unknown>)({
				submission: {
					delete: (args: unknown) => txSubmissionDeleteMock(args),
					update: (args: unknown) => txSubmissionUpdateMock(args),
				},
				institution: {
					update: (args: unknown) => txInstitutionUpdateMock(args),
				},
				user: {
					update: (args: unknown) => txUserUpdateMock(args),
				},
			}),
		);
	});

	it("getClaimSubmissionsDetailed maps submissions to institutions", async () => {
		prismaSubmissionFindManyMock.mockResolvedValue([
			{
				id: 1,
				entity_id: 100,
				type: "claim",
				creator: { id: "user-1", email: "u1@example.com" },
			},
			{
				id: 2,
				entity_id: 999,
				type: "claim",
				creator: null,
			},
		]);
		prismaInstitutionFindManyMock.mockResolvedValue([
			{
				id: 100,
				name: "Institution A",
				address: { street: "Main", street_number: "1" },
				users: [],
			},
		]);

		const result = await getClaimSubmissionsDetailed();

		expect(prismaSubmissionFindManyMock).toHaveBeenCalled();
		expect(prismaInstitutionFindManyMock).toHaveBeenCalled();
		expect(result).toHaveLength(2);
		expect(result[0].institution?.name).toBe("Institution A");
		expect(result[0].claimant?.email).toBe("u1@example.com");
		expect(result[1].institution).toBeNull();
	});

	it("reviewClaimSubmission rejects claims by deleting the submission", async () => {
		submissionFindByIdMock.mockResolvedValue({
			id: 5,
			type: "claim",
			entity_id: 10,
			created_by: "user-1",
			status: "approval_pending" as SubmissionStatus,
		});

		const result = await reviewClaimSubmission({
			id: 5,
			decision: "rejected",
		});

		expect(txSubmissionDeleteMock).toHaveBeenCalledWith({
			where: { id: 5 },
		});
		expect(revalidateAccountMock).toHaveBeenCalled();
		expect(result).toEqual({ id: 5, status: "rejected" });
	});

	it("reviewClaimSubmission approves claims and connects user + institution", async () => {
		submissionFindByIdMock.mockResolvedValue({
			id: 6,
			type: "claim",
			entity_id: 44,
			created_by: "user-2",
			status: "approval_pending" as SubmissionStatus,
		});
		const result = await reviewClaimSubmission({
			id: 6,
			decision: "approved",
		});

		expect(txInstitutionUpdateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 44 },
				data: { users: { connect: { id: "user-2" } } },
			}),
		);
		expect(txUserUpdateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "user-2" },
				data: { institutions: { connect: { id: 44 } } },
			}),
		);
		expect(txSubmissionDeleteMock).toHaveBeenCalledWith({
			where: { id: 6 },
		});
		expect(txSubmissionUpdateMock).not.toHaveBeenCalled();
		expect(revalidateAccountMock).toHaveBeenCalled();
		expect(result).toEqual({ id: 6, status: "approved" });
	});

	it("reviewClaimSubmission allows re-review for rejected claims", async () => {
		submissionFindByIdMock.mockResolvedValue({
			id: 66,
			type: "claim",
			entity_id: 77,
			created_by: "user-77",
			status: "rejected" as SubmissionStatus,
		});

		const result = await reviewClaimSubmission({
			id: 66,
			decision: "approved",
		});

		expect(txInstitutionUpdateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 77 },
				data: { users: { connect: { id: "user-77" } } },
			}),
		);
		expect(txUserUpdateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "user-77" },
				data: { institutions: { connect: { id: 77 } } },
			}),
		);
		expect(txSubmissionDeleteMock).toHaveBeenCalledWith({
			where: { id: 66 },
		});
		expect(result).toEqual({ id: 66, status: "approved" });
	});

	it("reviewClaimSubmission throws when submission is not a claim", async () => {
		submissionFindByIdMock.mockResolvedValue({
			id: 7,
			type: "create",
		});

		await expect(
			reviewClaimSubmission({ id: 7, decision: "approved" }),
		).rejects.toThrow("Submission is not a claim.");
	});

	it("reviewClaimSubmission throws when claim data is missing", async () => {
		submissionFindByIdMock.mockResolvedValue({
			id: 8,
			type: "claim",
			entity_id: null,
			created_by: null,
			status: "approval_pending" as SubmissionStatus,
		});

		await expect(
			reviewClaimSubmission({ id: 8, decision: "approved" }),
		).rejects.toThrow("Claim submission missing entity or user.");
	});
});
