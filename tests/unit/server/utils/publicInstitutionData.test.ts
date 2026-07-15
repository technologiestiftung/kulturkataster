import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessContext } from "@/server/utils/rbac";
import { loadPublicInstitutionData } from "@/server/utils/publicInstitutionData";

vi.mock("@/server/utils/rbac", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/server/utils/rbac")>();
	return {
		...actual,
		authorizeTable: vi.fn(),
		getGuestReadableFieldsForTable: vi.fn().mockResolvedValue(["name"]),
	};
});

const institutionListWithSelectWhereMock = vi.fn().mockResolvedValue([
	{
		id: 1,
		name: "Owned",
		email: "owned@example.test",
		users: [{ id: "user-1" }],
		groups: [],
	},
	{
		id: 2,
		name: "Public",
		email: "public@example.test",
		users: [],
		groups: [],
	},
]);
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
			email: new Set(["read"]),
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

	it("includes public preloads and redacts unowned internal fields", async () => {
		const result = await loadPublicInstitutionData({
			ctx: buildContext("own"),
			currentUserId: "user-1",
		});

		expect(institutionListWithSelectWhereMock).toHaveBeenCalledWith(
			{
				OR: [
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
			{
				id: true,
				name: true,
				email: true,
				users: { select: { id: true } },
				groups: { select: { id: true, users: { select: { id: true } } } },
			},
		);
		expect(result.institutions).toEqual([
			expect.objectContaining({
				id: 1,
				name: "Owned",
				email: "owned@example.test",
			}),
			{
				id: 2,
				name: "Public",
			},
		]);
	});

	it("keeps anonymous public institution preloads unscoped", async () => {
		await loadPublicInstitutionData({
			ctx: buildContext("own"),
			currentUserId: null,
		});

		expect(institutionListWithSelectWhereMock).toHaveBeenCalledWith(
			{ status: { in: ["public", "private", "archived"] } },
			{ id: true, name: true, email: true },
		);
	});
});
