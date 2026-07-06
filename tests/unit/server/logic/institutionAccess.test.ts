import { describe, expect, it } from "vitest";
import { buildInstitutionScopedWhere } from "@/server/logic/institutionAccess";
import { requireAllScope } from "@/server/utils/rbac";

describe("buildInstitutionScopedWhere", () => {
	it("returns base where for all scope", () => {
		const baseWhere = { id: 123 };
		expect(buildInstitutionScopedWhere("all", null, baseWhere)).toEqual(
			baseWhere,
		);
	});

	it("returns access where for own scope with user", () => {
		const where = buildInstitutionScopedWhere("own", "user-1");
		expect(where).toEqual({
			OR: [
				{ users: { some: { id: "user-1" } } },
				{ groups: { some: { users: { some: { id: "user-1" } } } } },
			],
		});
	});

	it("returns ANDed where when base where is provided", () => {
		const where = buildInstitutionScopedWhere("own", "user-1", {
			status: "public",
		});
		expect(where).toEqual({
			AND: [
				{ status: "public" },
				{
					OR: [
						{ users: { some: { id: "user-1" } } },
						{ groups: { some: { users: { some: { id: "user-1" } } } } },
					],
				},
			],
		});
	});

	it("returns no-access where for own scope without user", () => {
		expect(buildInstitutionScopedWhere("own", null)).toEqual({
			id: { equals: -1 },
		});
	});
});

describe("requireAllScope", () => {
	it("throws when scope is not all", () => {
		expect(() =>
			requireAllScope(
				{ role: "user", table: {}, tableScope: {}, field: {}, fieldOrder: {} },
				"group",
				"read",
			),
		).toThrowError(/Global read access required for group/);
	});

	it("does not throw when scope is all", () => {
		expect(() =>
			requireAllScope(
				{
					role: "admin",
					table: {},
					tableScope: { group: { read: "all" } },
					field: {},
				},
				"group",
				"read",
			),
		).not.toThrow();
	});
});
