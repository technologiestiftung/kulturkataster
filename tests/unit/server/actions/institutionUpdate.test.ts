import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateInstitution } from "@/server/actions/institutions";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
}));

const getTableScopeMock = vi.fn();

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			institution: {
				name: new Set(["read"]),
			},
		},
	}),
	authorizeTable: vi.fn(),
	authorizeFields: vi.fn(),
	getTableScope: () => getTableScopeMock(),
}));

const updateMock = vi.fn();
const updateWhereMock = vi.fn();
const findFirstWithIncludeMock = vi.fn();

vi.mock("@/server/data/institutionRepo", () => ({
	institutionRepo: {
		update: (id: number, data: unknown) => updateMock(id, data),
		updateWhere: (where: unknown, data: unknown) =>
			updateWhereMock(where, data),
		findFirstWithInclude: (where: unknown) => findFirstWithIncludeMock(where),
	},
}));

const buildInstitutionScopedWhereMock = vi.fn();

vi.mock("@/server/logic/institutionAccess", () => ({
	buildInstitutionScopedWhere: (...args: unknown[]) =>
		buildInstitutionScopedWhereMock(...args),
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: vi.fn(),
}));

describe("server actions: institutions update", () => {
	beforeEach(() => {
		getTableScopeMock.mockReset();
		updateMock.mockReset();
		updateWhereMock.mockReset();
		findFirstWithIncludeMock.mockReset();
		buildInstitutionScopedWhereMock.mockReset();
	});

	it("updateInstitution uses direct update for all scope", async () => {
		getTableScopeMock.mockReturnValue("all");
		updateMock.mockResolvedValue({ id: 1 });

		await updateInstitution({ id: 1, name: "Updated" });

		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ name: "Updated" }),
		);
		expect(updateWhereMock).not.toHaveBeenCalled();
	});

	it("updateInstitution uses scoped update for own scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		buildInstitutionScopedWhereMock.mockReturnValue({ id: 1 });
		updateWhereMock.mockResolvedValue({ count: 1 });
		findFirstWithIncludeMock.mockResolvedValue({ id: 1, name: "Updated" });

		await updateInstitution({ id: 1, name: "Updated" });

		expect(updateWhereMock).toHaveBeenCalledWith(
			{ id: 1 },
			expect.objectContaining({ name: "Updated" }),
		);
		expect(findFirstWithIncludeMock).toHaveBeenCalledWith({ id: 1 });
	});
});
