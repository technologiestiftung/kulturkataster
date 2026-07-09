import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getInstitutionById,
	updateInstitution,
} from "@/server/actions/institutions";

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
const findFirstWithIncludeMock = vi.fn();
const findFirstWithSelectMock = vi.fn();

vi.mock("@/server/data/institutionRepo", () => ({
	institutionRepo: {
		update: (id: number, data: unknown) => updateMock(id, data),
		findFirstWithInclude: (where: unknown) => findFirstWithIncludeMock(where),
		findFirstWithSelect: (where: unknown, select: unknown) =>
			findFirstWithSelectMock(where, select),
	},
}));

const buildInstitutionScopedWhereMock = vi.fn();
const buildInstitutionSelectMock = vi.fn();

vi.mock("@/server/logic/institutionAccess", () => ({
	buildInstitutionScopedWhere: (...args: unknown[]) =>
		buildInstitutionScopedWhereMock(...args),
}));

vi.mock("@/server/logic/institutionSelect", () => ({
	buildInstitutionSelect: (...args: unknown[]) =>
		buildInstitutionSelectMock(...args),
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: vi.fn(),
}));

describe("server actions: institutions update", () => {
	beforeEach(() => {
		getTableScopeMock.mockReset();
		updateMock.mockReset();
		findFirstWithIncludeMock.mockReset();
		findFirstWithSelectMock.mockReset();
		buildInstitutionScopedWhereMock.mockReset();
		buildInstitutionSelectMock.mockReset();
		buildInstitutionSelectMock.mockReturnValue({ id: true, name: true });
	});

	it("updateInstitution uses direct update for all scope", async () => {
		getTableScopeMock.mockReturnValue("all");
		updateMock.mockResolvedValue({ id: 1 });

		const result = await updateInstitution({
			id: 1,
			name: "Updated",
			address: null,
		});

		expect(result).toMatchObject({ ok: true });
		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ name: "Updated" }),
		);
	});

	it("updateInstitution uses scoped update for own scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		buildInstitutionScopedWhereMock.mockReturnValue({ id: 1, users: {} });
		findFirstWithIncludeMock.mockResolvedValue({ id: 1 });
		updateMock.mockResolvedValue({ id: 1, name: "Updated" });

		const result = await updateInstitution({
			id: 1,
			name: "Updated",
			address: null,
		});

		expect(result).toMatchObject({ ok: true });
		expect(findFirstWithIncludeMock).toHaveBeenCalledWith({ id: 1, users: {} });
		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ name: "Updated" }),
		);
	});

	it("updateInstitution persists cleared nullable fields as null", async () => {
		getTableScopeMock.mockReturnValue("all");
		updateMock.mockResolvedValue({ id: 1 });

		const result = await updateInstitution({
			id: 1,
			name: "Updated",
			address: null,
			owner_type: null,
			rental_contract_type: null,
			funding_type: null,
			utilization_status: null,
			established_since: null,
			established_until: null,
			protection_status: null,
			shared_use_allowed: null,
		});

		expect(result).toMatchObject({ ok: true });
		expect(updateMock).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				name: "Updated",
				owner_type: null,
				rental_contract_type: null,
				funding_type: null,
				utilization_status: null,
				established_since: null,
				established_until: null,
				protection_status: null,
				shared_use_allowed: null,
			}),
		);
	});

	it("getInstitutionById applies read scope and field select", async () => {
		getTableScopeMock.mockReturnValue("own");
		buildInstitutionScopedWhereMock.mockReturnValue({
			AND: [{ id: 42 }, { users: { some: { id: "user-1" } } }],
		});
		findFirstWithSelectMock.mockResolvedValue({ id: 42, name: "Scoped" });

		const result = await getInstitutionById(42);

		expect(result).toEqual({ id: 42, name: "Scoped" });
		expect(buildInstitutionScopedWhereMock).toHaveBeenCalledWith(
			"own",
			"user-1",
			{ id: 42 },
		);
		expect(findFirstWithSelectMock).toHaveBeenCalledWith(
			{ AND: [{ id: 42 }, { users: { some: { id: "user-1" } } }] },
			{ id: true, name: true },
		);
		expect(findFirstWithIncludeMock).not.toHaveBeenCalled();
	});
});
