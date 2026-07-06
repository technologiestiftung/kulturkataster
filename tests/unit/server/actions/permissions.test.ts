import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserIdMock, getAccessContextForUserMock } = vi.hoisted(
	() => ({
		getCurrentUserIdMock: vi.fn(),
		getAccessContextForUserMock: vi.fn(),
	}),
);

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/utils/rbac", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/server/utils/rbac")>();
	return {
		...actual,
		getAccessContextForUser: getAccessContextForUserMock,
	};
});

import { getDownloadReadableFields } from "@/server/actions/permissions";

describe("permissions server actions", () => {
	beforeEach(() => {
		getCurrentUserIdMock.mockReset();
		getAccessContextForUserMock.mockReset();
	});

	it("returns downloadable fields for authenticated downloads", async () => {
		getCurrentUserIdMock.mockResolvedValue("user-1");
		getAccessContextForUserMock.mockResolvedValue({
			role: "exporter",
			table: {},
			tableScope: {},
			field: {
				institution: {
					name: new Set(["read"]),
					email: new Set(["download"]),
				},
			},
			fieldOrder: {
				institution: {
					email: 0,
					name: 1,
				},
			},
		});

		await expect(getDownloadReadableFields("institution")).resolves.toEqual({
			readableFields: ["email"],
			audience: "internal",
		});
	});
});
