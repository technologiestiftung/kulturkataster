import { describe, expect, it, vi, beforeEach } from "vitest";
import { AccountEditModal } from "@/components/Modals/Pages/AccountEditModal";

const getCurrentUserMock = vi.fn();
const findByIdMock = vi.fn();
vi.mock("@/server/actions/auth", () => ({
	getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/server/data/userRepo", () => ({
	userRepo: {
		findById: findByIdMock,
	},
}));

vi.mock("@/components/Modals/Pages/AccountEditModal", () => ({
	AccountEditModal: () => null,
}));

describe("account edit page integration", () => {
	beforeEach(() => {
		getCurrentUserMock.mockReset();
		findByIdMock.mockReset();
	});

	it("renders account edit modal with user and profile data", async () => {
		getCurrentUserMock.mockResolvedValue({
			id: "user-1",
			email: "user@example.com",
		});
		findByIdMock.mockResolvedValue({
			first_name: "Jane",
			last_name: "Doe",
		});

		const pageModule = await import("@/app/[locale]/account/edit/page");
		const result = await pageModule.default({
			params: Promise.resolve({ locale: "de" }),
		});

		expect(getCurrentUserMock).toHaveBeenCalled();
		expect(findByIdMock).toHaveBeenCalledWith("user-1");
		expect(result).toMatchObject({
			type: AccountEditModal,
			props: expect.objectContaining({
				routePath: "/account/edit",
				returnTo: "/account",
				userId: "user-1",
				email: "user@example.com",
				firstName: "Jane",
				lastName: "Doe",
			}),
		});
	});

	it("returns null when no current user exists", async () => {
		getCurrentUserMock.mockResolvedValue(null);

		const pageModule = await import("@/app/[locale]/account/edit/page");
		const result = await pageModule.default({
			params: Promise.resolve({ locale: "de" }),
		});

		expect(result).toBeNull();
		expect(findByIdMock).not.toHaveBeenCalled();
	});
});
