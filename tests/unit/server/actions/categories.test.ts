import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createCategory,
	deleteCategory,
	updateCategory,
} from "@/server/actions/categories";
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
const createMock = vi.fn().mockResolvedValue({ id: 1, key: "music_space" });
const updateMock = vi.fn().mockResolvedValue({ id: 1 });
const removeMock = vi.fn().mockResolvedValue({ id: 1 });

vi.mock("@/server/data/categoryRepo", () => ({
	categoryRepo: {
		create: (data: unknown) => createMock(data),
		findById: (id: number) => findByIdMock(id),
		update: (id: number, data: unknown) => updateMock(id, data),
		remove: (id: number) => removeMock(id),
	},
}));

vi.mock("@/server/logic/traduoraTermTranslations", () => ({
	getCategoryEnumMapTermKey: ({
		key,
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
		createMock.mockClear();
		updateMock.mockClear();
		removeMock.mockClear();
		upsertEnumMapTermTranslationsMock.mockClear();
		findByIdMock.mockResolvedValue({
			id: 1,
			key: "music_space_live",
			child_categories: [],
		});
	});

	it("createCategory sanitizes keys to lowercase underscores", async () => {
		const result = await createCategory({ key: "Music Space / Live" });

		expect(result).toMatchObject({ ok: true });
		expect(createMock).toHaveBeenCalledWith(
			expect.objectContaining({
				key: "music_space_live",
			}),
		);
	});

	it("deleteCategory blocks deletion when subcategories exist", async () => {
		findByIdMock.mockResolvedValue({
			id: 1,
			child_categories: [{ id: 2 }],
		});

		const result = await deleteCategory(1);

		expect(result).toEqual({ ok: false, error: "hasSubcategories" });
		expect(removeMock).not.toHaveBeenCalled();
	});

	it("deleteCategory removes category without children", async () => {
		findByIdMock.mockResolvedValue({ id: 1, child_categories: [] });

		const result = await deleteCategory(1);
		expect(result).toEqual({ ok: true, data: { id: 1 } });
		expect(removeMock).toHaveBeenCalledWith(1);
	});

	it("updateCategory disconnects parent when parentCategoryId is null", async () => {
		const result = await updateCategory({ id: 1, parentCategoryId: null });
		expect(result).toMatchObject({ ok: true });
		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				parent_category: { disconnect: true },
			}),
		);
	});

	it("updateCategory does not update the key when the sanitized key is unchanged", async () => {
		const result = await updateCategory({ id: 1, key: "Music Space / Live" });

		expect(result).toMatchObject({ ok: true });
		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(updateMock.mock.calls[0]?.[1]).not.toHaveProperty("key");
	});

	it("updateCategory rejects changing the key", async () => {
		const result = await updateCategory({ id: 1, key: "Different Key" });

		expect(result).toEqual({ ok: false, error: "keyLocked" });
		expect(updateMock).not.toHaveBeenCalled();
	});

	it("updateCategory syncs enumMap translations when localized labels are provided", async () => {
		findByIdMock.mockResolvedValueOnce({
			id: 1,
			key: "music",
			child_categories: [],
		});
		updateMock.mockResolvedValueOnce({
			id: 1,
			key: "music",
			parent_category_id: null,
		});
		const result = await updateCategory({
			id: 1,
			key: "music",
			localizedLabels: {
				de: "Musik",
				en: "Music",
			},
		});

		expect(result).toMatchObject({ ok: true });
		expect(upsertEnumMapTermTranslationsMock).toHaveBeenCalledWith({
			termKey: "category.music",
			translations: {
				de: "Musik",
				en: "Music",
			},
		});
	});
});
