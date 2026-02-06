import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getClaimSubmissionsDetailed,
	reviewClaimSubmission,
} from "@/server/actions/submissions";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("admin-1"),
}));

const requireAllScopeMock = vi.fn();

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
	getTableScope: vi.fn(),
	requireScopeOrUser: vi.fn(),
}));

const submissionFindByIdMock = vi.fn();
const submissionRemoveMock = vi.fn();
const submissionUpdateMock = vi.fn();

vi.mock("@/server/data/submissionRepo", () => ({
	submissionRepo: {
		findById: (id: number) => submissionFindByIdMock(id),
		remove: (id: number) => submissionRemoveMock(id),
		update: (id: number, data: unknown) => submissionUpdateMock(id, data),
	},
}));

const prismaSubmissionFindManyMock = vi.fn();
const prismaInstitutionFindManyMock = vi.fn();
const prismaInstitutionUpdateMock = vi.fn();
const prismaUserUpdateMock = vi.fn();

vi.mock("@/server/prisma", () => ({
	prisma: {
		submission: {
			findMany: (args: unknown) => prismaSubmissionFindManyMock(args),
		},
		institution: {
			findMany: (args: unknown) => prismaInstitutionFindManyMock(args),
			update: (args: unknown) => prismaInstitutionUpdateMock(args),
		},
		user: {
			update: (args: unknown) => prismaUserUpdateMock(args),
		},
	},
}));

const revalidateAccountMock = vi.fn();
vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: () => revalidateAccountMock(),
}));

describe("server actions: claim submissions", () => {
	beforeEach(() => {
		requireAllScopeMock.mockReset();
		submissionFindByIdMock.mockReset();
		submissionRemoveMock.mockReset();
		submissionUpdateMock.mockReset();
		prismaSubmissionFindManyMock.mockReset();
		prismaInstitutionFindManyMock.mockReset();
		prismaInstitutionUpdateMock.mockReset();
		prismaUserUpdateMock.mockReset();
		revalidateAccountMock.mockReset();
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
		});

		const result = await reviewClaimSubmission({
			id: 5,
			decision: "rejected",
		});

		expect(submissionRemoveMock).toHaveBeenCalledWith(5);
		expect(revalidateAccountMock).toHaveBeenCalled();
		expect(result).toEqual({ id: 5, status: "rejected" });
	});

	it("reviewClaimSubmission approves claims and connects user + institution", async () => {
		submissionFindByIdMock.mockResolvedValue({
			id: 6,
			type: "claim",
			entity_id: 44,
			created_by: "user-2",
		});
		submissionUpdateMock.mockResolvedValue({ id: 6, status: "approved" });

		const result = await reviewClaimSubmission({
			id: 6,
			decision: "approved",
		});

		expect(prismaInstitutionUpdateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 44 },
				data: { users: { connect: { id: "user-2" } } },
			}),
		);
		expect(prismaUserUpdateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "user-2" },
				data: { institutions: { connect: { id: 44 } } },
			}),
		);
		expect(submissionUpdateMock).toHaveBeenCalledWith(
			6,
			expect.objectContaining({ status: "approved" }),
		);
		expect(revalidateAccountMock).toHaveBeenCalled();
		expect(result).toEqual({ id: 6, status: "approved" });
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
		});

		await expect(
			reviewClaimSubmission({ id: 8, decision: "approved" }),
		).rejects.toThrow("Claim submission missing entity or user.");
	});
});
