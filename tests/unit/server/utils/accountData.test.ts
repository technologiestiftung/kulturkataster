import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessContext } from "@/server/utils/rbac";
import { loadAccountData } from "@/server/utils/accountData";

const institutionListWithSelectWhereMock = vi.fn().mockResolvedValue([]);
vi.mock("@/server/data/institutionRepo", () => ({
	institutionRepo: {
		listWithSelect: vi.fn().mockResolvedValue([]),
		listWithSelectWhere: (where: unknown, select: unknown) =>
			institutionListWithSelectWhereMock(where, select),
	},
}));

vi.mock("@/server/data/userRepo", () => ({
	userRepo: {
		findById: vi.fn().mockResolvedValue(null),
		list: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@/server/data/groupRepo", () => ({
	groupRepo: {
		list: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@/server/data/roleRepo", () => ({
	roleRepo: {
		list: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@/server/data/categoryRepo", () => ({
	categoryRepo: {
		listAll: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@/server/data/submissionRepo", () => ({
	submissionRepo: {
		list: vi.fn().mockResolvedValue([]),
	},
}));

vi.mock("@/server/utils/accountEntityAudits", () => ({
	loadAccountEntityAudits: vi.fn().mockResolvedValue([]),
}));

const buildContext = (): AccessContext => ({
	role: "editor",
	table: {
		institution: new Set(["read"]),
	},
	tableScope: {
		institution: { read: "own" },
	},
	field: {
		institution: {
			name: new Set(["read"]),
		},
	},
	fieldOrder: {},
	fieldPins: {},
});

describe("account data loader", () => {
	beforeEach(() => {
		institutionListWithSelectWhereMock.mockClear();
	});

	it("keeps account institution tables restricted to assigned institutions", async () => {
		await loadAccountData({
			ctx: buildContext(),
			currentUserId: "user-1",
		});

		expect(institutionListWithSelectWhereMock).toHaveBeenCalledWith(
			{
				OR: [
					{ users: { some: { id: "user-1" } } },
					{
						groups: {
							some: { users: { some: { id: "user-1" } } },
						},
					},
				],
			},
			{ id: true, name: true },
		);
	});
});
