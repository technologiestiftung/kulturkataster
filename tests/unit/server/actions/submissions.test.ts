import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createSubmission,
	saveSubmissionNote,
	updateSubmission,
} from "@/server/actions/submissions";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: vi.fn(),
}));

const getTableScopeMock = vi.fn();
const requireScopeOrUserMock = vi.fn();

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			submission: {
				name: new Set(["read"]),
			},
		},
	}),
	authorizeTable: vi.fn(),
	getTableScope: () => getTableScopeMock(),
	requireScopeOrUser: (...args: unknown[]) => requireScopeOrUserMock(...args),
}));

const updateMock = vi.fn();
const createMock = vi.fn();
const createNoteMock = vi.fn();
const findByIdMock = vi.fn();
const findFirstMock = vi.fn();

vi.mock("@/server/data/submissionRepo", () => ({
	submissionRepo: {
		update: (id: number, data: unknown) => updateMock(id, data),
		create: (data: unknown) => createMock(data),
		createNote: (data: unknown) => createNoteMock(data),
		findById: (id: number) => findByIdMock(id),
		findFirst: (where: unknown) => findFirstMock(where),
	},
}));

describe("server actions: submissions", () => {
	beforeEach(() => {
		getTableScopeMock.mockReset();
		requireScopeOrUserMock.mockReset();
		updateMock.mockReset();
		createMock.mockReset();
		createNoteMock.mockReset();
		findByIdMock.mockReset();
		findFirstMock.mockReset();
	});

	it("createSubmission checks pending duplicates only for the current user", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		findFirstMock.mockResolvedValue(null);
		createMock.mockResolvedValue({ id: 99 });

		await createSubmission({
			entityType: SubmissionEntityType.institution,
			entityId: 12,
			type: SubmissionType.update,
			status: "approval_pending",
			data: { name: "A" },
		});

		expect(findFirstMock).toHaveBeenCalledWith(
			expect.objectContaining({
				entity_type: SubmissionEntityType.institution,
				entity_id: 12,
				type: SubmissionType.update,
				status: "approval_pending",
				created_by: "user-1",
			}),
		);
		expect(createMock).toHaveBeenCalled();
	});

	it("createSubmission does not run pending duplicate check for anonymous users", async () => {
		const mockedGetCurrentUserId = vi.mocked(getCurrentUserId);
		mockedGetCurrentUserId.mockResolvedValueOnce(null);
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		createMock.mockResolvedValue({ id: 100 });

		await createSubmission({
			entityType: SubmissionEntityType.institution,
			entityId: 22,
			type: SubmissionType.update,
			status: "approval_pending",
			data: { name: "B" },
		});

		expect(findFirstMock).not.toHaveBeenCalled();
		expect(createMock).toHaveBeenCalledWith(
			expect.objectContaining({
				creator: undefined,
			}),
		);
	});

	it("updateSubmission allows admins to update any submission", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		updateMock.mockResolvedValue({ id: 1 });

		await updateSubmission({ id: 1, data: { foo: "bar" } });

		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ data: { foo: "bar" } }),
		);
	});

	it("updateSubmission allows edits on non-draft submissions for own scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		requireScopeOrUserMock.mockReturnValue("user-1");
		findFirstMock.mockResolvedValue({ id: 1, status: "approval_pending" });
		updateMock.mockResolvedValue({ id: 1 });

		await updateSubmission({ id: 1, data: { foo: "bar" } });
		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ data: { foo: "bar" } }),
		);
	});

	it("updateSubmission updates draft submissions for own scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		requireScopeOrUserMock.mockReturnValue("user-1");
		findFirstMock.mockResolvedValue({ id: 1, status: "draft" });
		updateMock.mockResolvedValue({ id: 1 });

		await updateSubmission({ id: 1, data: { foo: "bar" } });

		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ data: { foo: "bar" } }),
		);
	});

	it("updateSubmission normalizes tagged DateTime data", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		updateMock.mockResolvedValue({ id: 1 });

		await updateSubmission({
			id: 1,
			data: {
				established_since: {
					$type: "DateTime",
					value: "2019-01-01T00:00:00.000Z",
				},
			},
		});

		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				data: {
					established_since: "2019-01-01T00:00:00.000Z",
				},
			}),
		);
	});

	it("saveSubmissionNote creates a note and returns the refreshed submission", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		findByIdMock
			.mockResolvedValueOnce({
				id: 7,
				status: "approval_pending",
				created_by: "user-1",
			})
			.mockResolvedValueOnce({
				id: 7,
				status: "approval_pending",
				notes: [{ id: 1, note: "Review note" }],
			});
		createNoteMock.mockResolvedValue({ id: 1 });

		const result = await saveSubmissionNote({
			submissionId: 7,
			note: "Review note",
		});

		expect(createNoteMock).toHaveBeenCalledWith(
			expect.objectContaining({
				note: "Review note",
				submission: { connect: { id: 7 } },
			}),
		);
		expect(result).toEqual(
			expect.objectContaining({
				id: 7,
				notes: [{ id: 1, note: "Review note" }],
			}),
		);
	});
});
