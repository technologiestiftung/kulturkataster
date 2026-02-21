import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteCategory, updateCategory } from "@/server/actions/categories";
import { upsertEnumMapTermTranslations } from "@/server/logic/traduoraTermTranslations";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			category: {
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

const findByIdMock = vi.fn();
const updateMock = vi.fn().mockResolvedValue({ id: 1 });
const removeMock = vi.fn().mockResolvedValue({ id: 1 });

vi.mock("@/server/data/categoryRepo", () => ({
	categoryRepo: {
		findById: (id: number) => findByIdMock(id),
		update: (id: number, data: unknown) => updateMock(id, data),
		remove: (id: number) => removeMock(id),
	},
}));

vi.mock("@/server/logic/traduoraTermTranslations", () => ({
	getCategoryEnumMapTermKey: ({
		key,
		parentCategoryId,
	}: {
		key: string;
		parentCategoryId?: number | null;
	}) => `category.${key}`,
	getEnumMapTermTranslations: vi.fn(),
	upsertEnumMapTermTranslations: vi.fn().mockResolvedValue(undefined),
}));

const upsertEnumMapTermTranslationsMock = vi.mocked(
	upsertEnumMapTermTranslations,
);

describe("server actions: categories", () => {
	beforeEach(() => {
		findByIdMock.mockReset();
		updateMock.mockClear();
		removeMock.mockClear();
		upsertEnumMapTermTranslationsMock.mockClear();
	});

	it("deleteCategory blocks deletion when subcategories exist", async () => {
		findByIdMock.mockResolvedValue({
			id: 1,
			child_categories: [{ id: 2 }],
		});

		await expect(deleteCategory(1)).rejects.toThrow(
			"Category has subcategories",
		);
		expect(removeMock).not.toHaveBeenCalled();
	});

	it("deleteCategory removes category without children", async () => {
		findByIdMock.mockResolvedValue({ id: 1, child_categories: [] });

		await deleteCategory(1);
		expect(removeMock).toHaveBeenCalledWith(1);
	});

	it("updateCategory disconnects parent when parentCategoryId is null", async () => {
		await updateCategory({ id: 1, parentCategoryId: null });
		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				parent_category: { disconnect: true },
			}),
		);
	});

	it("updateCategory syncs enumMap translations when localized labels are provided", async () => {
		updateMock.mockResolvedValueOnce({
			id: 1,
			key: "music",
			parent_category_id: null,
		});
		await updateCategory({
			id: 1,
			key: "music",
			localizedLabels: {
				de: "Musik",
				en: "Music",
			},
		});

		expect(upsertEnumMapTermTranslationsMock).toHaveBeenCalledWith({
			termKey: "category.music",
			translations: {
				de: "Musik",
				en: "Music",
			},
		});
	});
});
