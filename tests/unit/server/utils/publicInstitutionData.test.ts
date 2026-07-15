import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessContext } from "@/server/utils/rbac";
import { loadPublicInstitutionData } from "@/server/utils/publicInstitutionData";

const institutionListWithSelectWhereMock = vi.fn().mockResolvedValue([]);
vi.mock("@/server/data/institutionRepo", () => ({
	institutionRepo: {
		listWithSelectWhere: (where: unknown, select: unknown) =>
			institutionListWithSelectWhereMock(where, select),
	},
}));

const categoryListWithChildrenMock = vi.fn().mockResolvedValue([]);
vi.mock("@/server/data/categoryRepo", () => ({
	categoryRepo: {
		listWithChildren: () => categoryListWithChildrenMock(),
	},
}));

const addressListDistinctMock = vi.fn().mockResolvedValue([]);
vi.mock("@/server/data/addressRepo", () => ({
	addressRepo: {
		listDistinct: (where: unknown) => addressListDistinctMock(where),
	},
}));

const buildContext = (institutionScope: "own" | "all"): AccessContext => ({
	role: "editor",
	table: {
		institution: new Set(["read"]),
		category: new Set(["read"]),
		address: new Set(["read"]),
	},
	tableScope: {
		institution: { read: institutionScope },
		category: { read: "all" },
		address: { read: "all" },
	},
	field: {
		institution: {
			name: new Set(["read"]),
		},
	},
	fieldOrder: {},
	fieldPins: {},
});

describe("public institution data loader", () => {
	beforeEach(() => {
		institutionListWithSelectWhereMock.mockClear();
		categoryListWithChildrenMock.mockClear();
		addressListDistinctMock.mockClear();
	});

	it("restricts own-scope institution preloads to assigned institutions", async () => {
		await loadPublicInstitutionData({
			ctx: buildContext("own"),
			currentUserId: "user-1",
		});

		expect(institutionListWithSelectWhereMock).toHaveBeenCalledWith(
			{
				AND: [
					{ status: { in: ["public", "private", "archived"] } },
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
				],
			},
			{ id: true, name: true },
		);
	});
});
