import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersTable } from "@/components/Users";
import { UserFormModal } from "@/components/Users/UserFormModal";
import { UserClaimReviewModal } from "@/components/Users/UserClaimReviewModal";

const getClaimSubmissionsDetailedMock = vi.fn();
vi.mock("@/server/actions/submissions", () => ({
	getClaimSubmissionsDetailed: getClaimSubmissionsDetailedMock,
}));

vi.mock("@/components/Users", () => ({
	UsersTable: () => null,
}));

vi.mock("@/components/Users/UserFormModal", () => ({
	UserFormModal: () => null,
}));

vi.mock("@/components/Users/UserClaimReviewModal", () => ({
	UserClaimReviewModal: () => null,
}));

describe("users pages integration", () => {
	beforeEach(() => {
		getClaimSubmissionsDetailedMock.mockReset();
	});

	it("renders users dashboard page with UsersTable", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/users/page"
		);
		const result = pageModule.default();
		const suspense = result.props.children.props.children;

		expect(suspense.props.children).toMatchObject({
			type: UsersTable,
		});
	});

	it("renders create user page with proper UserFormModal props", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/users/new/page"
		);
		const result = pageModule.default();

		expect(result).toMatchObject({
			type: UserFormModal,
			props: expect.objectContaining({
				mode: "create",
				routePath: "/account/users/new",
				returnTo: "/account/users",
			}),
		});
	});

	it("renders edit user page with user id from route params", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/users/[id]/edit/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "user-42" }),
		});

		expect(result).toMatchObject({
			type: UserFormModal,
			props: expect.objectContaining({
				mode: "edit",
				userId: "user-42",
				routePath: "/account/users/user-42/edit",
				returnTo: "/account/users",
			}),
		});
	});

	it("renders review page with UserClaimReviewModal", async () => {
		getClaimSubmissionsDetailedMock.mockResolvedValueOnce([
			{ submission: { id: 10 } },
		]);

		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/users/[id]/review/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "user-42" }),
		});

		expect(getClaimSubmissionsDetailedMock).toHaveBeenCalledWith("user-42");
		expect(result).toMatchObject({
			type: UserClaimReviewModal,
			props: expect.objectContaining({
				routePath: "/account/users/user-42/review",
				returnTo: "/account/users",
			}),
		});
	});
});
