import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Prisma } from "@/generated/prisma";
import { getCategoriesWithSubcategories } from "@/server/actions/categories";
import { getDistricts } from "@/server/actions/addresses";
import {
	searchInstitutions,
} from "@/server/actions/institutions";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			institution: {
				name: new Set(["read"]),
			},
		},
	}),
	throwIfUnauthorized: vi.fn(),
	authorizeTable: vi.fn(),
	authorizeFields: vi.fn(),
	getTableScope: vi.fn().mockReturnValue("all"),
	requireAllScope: vi.fn(),
	getScopeUserId: vi.fn().mockReturnValue(null),
}));

const listMock = vi.fn().mockResolvedValue([]);
const listWithSelectWhereMock = vi.fn().mockResolvedValue([]);
const searchMock = vi.fn().mockResolvedValue([]);
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

	it("getCategoriesWithSubcategories calls repo", async () => {
		await getCategoriesWithSubcategories();
		expect(listWithChildrenMock).toHaveBeenCalledTimes(1);
	});

	it("getDistricts filters null districts", async () => {
		const districts = await getDistricts();
		expect(districts).toEqual(["mitte"]);
	});
});
