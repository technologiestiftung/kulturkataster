import { describe, expect, it, vi } from "vitest";
import { GroupsTable } from "@/components/Groups";
import { GroupFormModal } from "@/components/Groups/GroupFormModal";

vi.mock("@/components/Groups", () => ({
	GroupsTable: () => null,
}));

vi.mock("@/components/Groups/GroupFormModal", () => ({
	GroupFormModal: () => null,
}));

describe("groups pages integration", () => {
	it("renders groups dashboard page with GroupsTable", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/groups/page"
		);
		const result = pageModule.default();
		const suspense = result.props.children.props.children;

		expect(suspense.props.children).toMatchObject({
			type: GroupsTable,
		});
	});

	it("renders create group page with proper GroupFormModal props", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/groups/new/page"
		);
		const result = pageModule.default();

		expect(result).toMatchObject({
			type: GroupFormModal,
			props: expect.objectContaining({
				mode: "create",
				routePath: "/account/groups/new",
				returnTo: "/account/groups",
			}),
		});
	});

	it("renders edit group page with group id from route params", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/groups/[id]/edit/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "42" }),
		});

		expect(result).toMatchObject({
			type: GroupFormModal,
			props: expect.objectContaining({
				mode: "edit",
				groupId: "42",
				routePath: "/account/groups/42/edit",
				returnTo: "/account/groups",
			}),
		});
	});
});
