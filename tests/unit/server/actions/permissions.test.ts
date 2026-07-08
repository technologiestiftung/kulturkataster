import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	getCurrentUserIdMock,
	getAccessContextForUserMock,
	getGuestDownloadableFieldsForTableMock,
	institutionFindManyMock,
} = vi.hoisted(() => ({
	getCurrentUserIdMock: vi.fn(),
	getAccessContextForUserMock: vi.fn(),
	getGuestDownloadableFieldsForTableMock: vi.fn(),
	institutionFindManyMock: vi.fn(),
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/utils/rbac", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/server/utils/rbac")>();
	return {
		...actual,
		getAccessContextForUser: getAccessContextForUserMock,
		getGuestDownloadableFieldsForTable: getGuestDownloadableFieldsForTableMock,
	};
});

vi.mock("@/server/prisma", () => ({
	prisma: {
		institution: {
			findMany: institutionFindManyMock,
		},
	},
}));

import { getDownloadReadableFields } from "@/server/actions/permissions";

describe("permissions server actions", () => {
	beforeEach(() => {
		getCurrentUserIdMock.mockReset();
		getAccessContextForUserMock.mockReset();
		getGuestDownloadableFieldsForTableMock.mockReset();
		institutionFindManyMock.mockReset();
		getGuestDownloadableFieldsForTableMock.mockResolvedValue(["name"]);
	});

	it("returns downloadable fields for authenticated downloads", async () => {
		getCurrentUserIdMock.mockResolvedValue("user-1");
		getAccessContextForUserMock.mockResolvedValue({
			role: "exporter",
			table: {},
			tableScope: {
				institution: {
					read: "all",
				},
			},
			field: {
				institution: {
					name: new Set(["read"]),
					email: new Set(["download"]),
				},
			},
			fieldOrder: {
				institution: {
					name: 0,
					email: 1,
				},
			},
			fieldPins: {},
		});

		await expect(
			getDownloadReadableFields("institution", [1, 2]),
		).resolves.toEqual({
			readableFields: ["email"],
			guestReadableFields: ["name"],
			columnFields: ["name", "email"],
			audience: "internal",
			internalInstitutionIds: null,
		});
	});

	it("returns scoped institution ids for authenticated own-scope downloads", async () => {
		getCurrentUserIdMock.mockResolvedValue("user-1");
		getAccessContextForUserMock.mockResolvedValue({
			role: "editor",
			table: {},
			tableScope: {
				institution: {
					read: "own",
				},
			},
			field: {
				institution: {
					email: new Set(["download"]),
				},
			},
			fieldOrder: {
				institution: {
					name: 0,
					email: 1,
				},
			},
			fieldPins: {},
		});
		institutionFindManyMock.mockResolvedValue([{ id: 1 }]);

		await expect(
			getDownloadReadableFields("institution", [1, 2]),
		).resolves.toEqual({
			readableFields: ["email"],
			guestReadableFields: ["name"],
			columnFields: ["name", "email"],
			audience: "internal",
			internalInstitutionIds: [1],
		});
		expect(institutionFindManyMock).toHaveBeenCalledWith(
			expect.objectContaining({
				select: { id: true },
			}),
		);
	});
});
