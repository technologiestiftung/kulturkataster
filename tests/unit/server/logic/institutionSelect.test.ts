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

	it("selects street number with readable street for address display", () => {
		const select = buildInstitutionSelect(
			createContext({
				"address.street": new Set(["read"]),
			}),
		);

		expect(select).toMatchObject({
			id: true,
			address: {
				select: {
					id: true,
					street: true,
					street_number: true,
				},
			},
		});
	});

	it("selects only requested address and contact person subfields", () => {
		const select = buildInstitutionSelect(
			createContext({
				"address.cultural_area": new Set(["read"]),
				"contact_person.email": new Set(["read"]),
			}),
		);

		expect(select).toMatchObject({
			id: true,
			address: {
				select: {
					id: true,
					cultural_area: true,
				},
			},
			contact_person: {
				select: {
					id: true,
					email: true,
				},
			},
		});
		expect(select?.address).not.toMatchObject({
			select: {
				street: true,
				city: true,
			},
		});
		expect(select?.contact_person).not.toMatchObject({
			select: {
				first_name: true,
				phone: true,
			},
		});
	});
});
