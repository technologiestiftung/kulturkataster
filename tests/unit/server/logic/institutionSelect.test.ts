import { describe, expect, it } from "vitest";
import { buildInstitutionSelect } from "@/server/logic/institutionSelect";
import type { AccessContext } from "@/server/utils/rbac";

const createContext = (fields: Record<string, Set<string>>) =>
	({
		field: {
			institution: fields,
		},
	}) as unknown as AccessContext;

describe("buildInstitutionSelect", () => {
	it("adds active-only where clause for categories relation", () => {
		const select = buildInstitutionSelect(
			createContext({
				categories: new Set(["read"]),
			}),
		);

		expect(select).toBeTruthy();
		expect(select).toMatchObject({
			id: true,
			categories: {
				where: { status: "active" },
				select: {
					id: true,
					key: true,
					icon: true,
					description: true,
					status: true,
					parent_category_id: true,
				},
			},
		});
	});

	it("keeps active-only where clause when selecting nested category fields", () => {
		const select = buildInstitutionSelect(
			createContext({
				"categories.key": new Set(["read"]),
			}),
		);

		expect(select).toBeTruthy();
		expect(select).toMatchObject({
			id: true,
			categories: {
				where: { status: "active" },
				select: {
					id: true,
					key: true,
				},
			},
		});
	});

	it("selects categories when readable subcategories are requested", () => {
		const select = buildInstitutionSelect(
			createContext({
				subcategories: new Set(["read"]),
			}),
		);

		expect(select).toBeTruthy();
		expect(select).not.toHaveProperty("subcategories");
		expect(select).toMatchObject({
			id: true,
			categories: {
				where: { status: "active" },
				select: {
					id: true,
					key: true,
					icon: true,
					description: true,
					status: true,
					parent_category_id: true,
				},
			},
		});
	});
});
