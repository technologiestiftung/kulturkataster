import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	canTable,
	getTableScope,
	requireScopeOrUser,
	list,
	listByCorrelationIds,
} = vi.hoisted(() => ({
	canTable: vi.fn(),
	getTableScope: vi.fn(),
	requireScopeOrUser: vi.fn(),
	list: vi.fn(),
	listByCorrelationIds: vi.fn(),
}));

vi.mock("@/server/utils/rbac", () => ({
	canTable,
	getTableScope,
	requireScopeOrUser,
}));

vi.mock("@/server/data/entityAuditRepo", () => ({
	entityAuditRepo: {
		list,
		listByCorrelationIds,
	},
}));

import { loadAccountEntityAuditsPage } from "@/server/utils/accountEntityAudits";

const makeAudit = (overrides: Record<string, unknown>) => ({
	id: 1,
	entity_type: "user",
	entity_id: "current-user",
	action: "update",
	old_data: null,
	new_data: null,
	meta_info: null,
	status: "completed",
	changed_by: "admin-user",
	changed_at: new Date("2026-01-01T10:00:00Z"),
	user: { id: "admin-user", email: "admin@example.com" },
	...overrides,
});

describe("loadAccountEntityAuditsPage", () => {
	beforeEach(() => {
		canTable.mockReset();
		getTableScope.mockReset();
		requireScopeOrUser.mockReset();
		list.mockReset();
		listByCorrelationIds.mockReset();

		canTable.mockReturnValue(true);
		getTableScope.mockReturnValue("own");
		requireScopeOrUser.mockReturnValue("current-user");
		listByCorrelationIds.mockResolvedValue([]);
	});

	it("loads audits where the current user is the changed entity, even when an admin changed it", async () => {
		const adminChangedCurrentUser = makeAudit({
			id: 2,
			meta_info: { reason: "role-assignment" },
			changed_by: "admin-user",
			user: { id: "admin-user", email: "admin@example.com" },
		});
		const currentUserChangedOwnProfile = makeAudit({
			id: 1,
			entity_id: "current-user",
			changed_by: "current-user",
			user: { id: "current-user", email: "current@example.com" },
		});
		list.mockResolvedValue([
			adminChangedCurrentUser,
			currentUserChangedOwnProfile,
		]);

		const result = await loadAccountEntityAuditsPage({
			ctx: {} as Parameters<typeof loadAccountEntityAuditsPage>[0]["ctx"],
			currentUserId: "current-user",
		});

		expect(list).toHaveBeenCalledWith({
			where: {
				OR: [
					{ changed_by: "current-user" },
					{ entity_type: "user", entity_id: "current-user" },
				],
			},
			before: undefined,
			take: 201,
		});
		expect(result.audits).toHaveLength(2);
		expect(result.audits[0]).toMatchObject({
			id: 2,
			changed_by: null,
			user: null,
			meta_info: {
				reason: "role-assignment",
				actor_hidden: true,
			},
		});
		expect(result.audits[1]).toMatchObject({
			id: 1,
			changed_by: "current-user",
			user: { id: "current-user" },
		});
	});
});
