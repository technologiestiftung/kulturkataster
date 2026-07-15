import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Prisma } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";
import { getCategoriesWithSubcategories } from "@/server/actions/categories";
import { getDistricts } from "@/server/actions/addresses";
import { searchInstitutions } from "@/server/actions/institutions";
import { getTableScope } from "@/server/utils/rbac";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			institution: {
				name: new Set(["read"]),
				email: new Set(["read"]),
			},
		},
	}),
	throwIfUnauthorized: vi.fn(),
	authorizeTable: vi.fn(),
	authorizeFields: vi.fn(),
	getTableScope: vi.fn().mockReturnValue("all"),
	getGuestReadableFieldsForTable: vi.fn().mockResolvedValue(["name"]),
	requireAllScope: vi.fn(),
	getScopeUserId: vi.fn((scope: "own" | "all", userId: string | null) =>
		scope === "all" ? null : userId,
	),
}));

const listMock = vi.fn().mockResolvedValue([]);
const listWithSelectWhereMock = vi.fn().mockResolvedValue([]);
const searchMock = vi.fn().mockResolvedValue([
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
		list: () => listMock(),
		listWithSelect: () => listMock(),
		listWithSelectWhere: (where: Prisma.InstitutionWhereInput) =>
			listWithSelectWhereMock(where),
		search: (where: Prisma.InstitutionWhereInput) => searchMock(where),
		searchWithSelect: (where: Prisma.InstitutionWhereInput) =>
			searchMock(where),
	},
}));

const listWithChildrenMock = vi.fn().mockResolvedValue([]);
vi.mock("@/server/data/categoryRepo", () => ({
	categoryRepo: {
		listWithChildren: () => listWithChildrenMock(),
	},
}));

const listDistinctMock = vi
	.fn()
	.mockResolvedValue([{ district: "mitte" }, { district: null }]);
vi.mock("@/server/data/addressRepo", () => ({
	addressRepo: {
		listDistinct: () => listDistinctMock(),
	},
}));

describe("server actions: institutions", () => {
	beforeEach(() => {
		listMock.mockClear();
		listWithSelectWhereMock.mockClear();
		searchMock.mockClear();
		listWithChildrenMock.mockClear();
		listDistinctMock.mockClear();
		vi.mocked(getCurrentUserId).mockResolvedValue("user-1");
		vi.mocked(getTableScope).mockReturnValue("all");
	});

	it("searchInstitutions returns [] for empty query", async () => {
		const result = await searchInstitutions("   ");
		expect(result).toEqual([]);
		expect(searchMock).not.toHaveBeenCalled();
	});

	it("searchInstitutions uses repo search for valid query", async () => {
		await searchInstitutions("museum");
		expect(searchMock).toHaveBeenCalledTimes(1);
	});

	it("searchInstitutions includes public matches and redacts unowned internal fields", async () => {
		vi.mocked(getTableScope).mockReturnValue("own");

		const result = await searchInstitutions("museum");

		expect(searchMock).toHaveBeenCalledWith({
			OR: [
				{
					AND: [
						expect.objectContaining({
							AND: expect.any(Array),
						}),
						{ status: { in: ["public", "private", "archived"] } },
					],
				},
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
		});
		expect(result).toEqual([
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

	it("searchInstitutions keeps anonymous public search unscoped", async () => {
		vi.mocked(getCurrentUserId).mockResolvedValue(null);
		vi.mocked(getTableScope).mockReturnValue("own");

		await searchInstitutions("museum");

		expect(searchMock).toHaveBeenCalledWith({
			AND: [
				expect.objectContaining({
					AND: expect.any(Array),
				}),
				{ status: { in: ["public", "private", "archived"] } },
			],
		});
	});

	it("getCategoriesWithSubcategories calls repo", async () => {
		await getCategoriesWithSubcategories();
		expect(listWithChildrenMock).toHaveBeenCalledTimes(1);
	});

	it("getDistricts filters null districts", async () => {
		const districts = await getDistricts();
		expect(districts).toEqual(["mitte"]);
	});
});
