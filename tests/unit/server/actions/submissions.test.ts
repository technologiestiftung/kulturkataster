import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSubmission } from "@/server/actions/submissions";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
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
const findFirstMock = vi.fn();

vi.mock("@/server/data/submissionRepo", () => ({
	submissionRepo: {
		update: (id: number, data: unknown) => updateMock(id, data),
		findFirst: (where: unknown) => findFirstMock(where),
	},
}));

describe("server actions: submissions", () => {
	beforeEach(() => {
		getTableScopeMock.mockReset();
		requireScopeOrUserMock.mockReset();
		updateMock.mockReset();
		findFirstMock.mockReset();
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
});
