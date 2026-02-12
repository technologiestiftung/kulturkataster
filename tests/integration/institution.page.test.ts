import { describe, expect, it, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";

const getCurrentUserMock = vi.fn<() => Promise<User | null>>();

vi.mock("@/server/actions/auth", () => ({
	getCurrentUser: getCurrentUserMock,
}));

describe("institution page integration", () => {
	beforeEach(() => {
		getCurrentUserMock.mockReset();
	});

	it("passes authenticated=true to intro modal when user exists", async () => {
		getCurrentUserMock.mockResolvedValue({
			id: "user-1",
			app_metadata: {},
			user_metadata: {},
			aud: "authenticated",
			created_at: new Date().toISOString(),
		} as User);

		const pageModule = await import("@/app/[locale]/institution/page");
		const element = await pageModule.default();

		expect(element.props.routePath).toBe("/institution");
		expect(element.props.isAuthenticated).toBe(true);
	});

	it("passes authenticated=false to intro modal when no user exists", async () => {
		getCurrentUserMock.mockResolvedValue(null);

		const pageModule = await import("@/app/[locale]/institution/page");
		const element = await pageModule.default();

		expect(element.props.routePath).toBe("/institution");
		expect(element.props.isAuthenticated).toBe(false);
	});
});
