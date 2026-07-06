import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserIdMock, roleRepoMock } = vi.hoisted(() => ({
	getCurrentUserIdMock: vi.fn(),
	roleRepoMock: {
		findById: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({}),
	authorizeTable: vi.fn(),
	requireAllScope: vi.fn(),
}));

vi.mock("@/server/data/roleRepo", () => ({
	roleRepo: roleRepoMock,
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: vi.fn(),
}));

import { updateRole } from "@/server/actions/roles";

describe("server actions: roles", () => {
	beforeEach(() => {
		getCurrentUserIdMock.mockReset();
		roleRepoMock.findById.mockReset();
		roleRepoMock.update.mockReset();
		getCurrentUserIdMock.mockResolvedValue("user-1");
	});

	it("updates system role permissions and global field order", async () => {
		const role = {
			id: 1,
			name: "Admin",
			description: "System role",
			is_system: true,
			created_at: new Date("2025-01-01"),
			updated_at: new Date("2025-01-01"),
			table_permissions: [],
			field_permissions: [],
			users: [],
		};
		roleRepoMock.findById.mockResolvedValue(role);
		roleRepoMock.update.mockResolvedValue(role);

		await updateRole({
			id: 1,
			name: "Admin renamed",
			tablePermissions: [{ table: "institution", action: "read" }],
			fieldPermissions: [
				{ table: "institution", field: "internal_notes", action: "read" },
			],
			fieldOrder: {
				table: "institution",
				fields: ["internal_notes", "name"],
			},
		});

		expect(roleRepoMock.update).toHaveBeenCalledWith(1, {
			fieldOrder: {
				table: "institution",
				fields: ["internal_notes", "name"],
			},
			fieldPermissions: [
				{ table: "institution", field: "internal_notes", action: "read" },
			],
			id: 1,
			name: "Admin renamed",
			tablePermissions: [{ table: "institution", action: "read" }],
		});
	});
});
