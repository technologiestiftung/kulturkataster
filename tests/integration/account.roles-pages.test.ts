import { describe, expect, it, vi } from "vitest";
import { RolesTable } from "@/components/Roles";
import { RoleFormModal } from "@/components/Roles/RoleFormModal";

vi.mock("@/components/Roles", () => ({
	RolesTable: () => null,
}));

vi.mock("@/components/Roles/RoleFormModal", () => ({
	RoleFormModal: () => null,
}));

describe("roles pages integration", () => {
	it("renders roles dashboard page with RolesTable", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/roles/page"
		);
		const result = pageModule.default();
		const suspense = result.props.children.props.children;

		expect(suspense.props.children).toMatchObject({
			type: RolesTable,
		});
	});

	it("renders create role page with proper RoleFormModal props", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/roles/new/page"
		);
		const result = pageModule.default();

		expect(result).toMatchObject({
			type: RoleFormModal,
			props: expect.objectContaining({
				mode: "create",
				routePath: "/account/roles/new",
				returnTo: "/account/roles",
			}),
		});
	});

	it("renders edit role page with role id from route params", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/roles/[id]/edit/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "42" }),
		});

		expect(result).toMatchObject({
			type: RoleFormModal,
			props: expect.objectContaining({
				mode: "edit",
				roleId: "42",
				routePath: "/account/roles/42/edit",
				returnTo: "/account/roles",
			}),
		});
	});
});
