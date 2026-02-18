import { describe, expect, it, vi, beforeEach } from "vitest";
import type { User } from "@supabase/supabase-js";

const getCurrentUserMock = vi.fn<() => Promise<User | null>>();

vi.mock("@/server/actions/auth", () => ({
	getCurrentUser: getCurrentUserMock,
}));

describe("institution modal page integration", () => {
	beforeEach(() => {
		getCurrentUserMock.mockReset();
	});

	it("passes showThankYou=true to intro modal when query param is set", async () => {
		getCurrentUserMock.mockResolvedValue({
			id: "user-1",
			app_metadata: {},
			user_metadata: {},
			aud: "authenticated",
			created_at: new Date().toISOString(),
		} as User);

		const pageModule = await import(
			"@/app/[locale]/@modal/(.)institution/page"
		);
		const element = await pageModule.default({
			searchParams: Promise.resolve({ thankyou: "1" }),
		});

		expect(element.props.routePath).toBe("/institution");
		expect(element.props.isAuthenticated).toBe(true);
		expect(element.props.showThankYou).toBe(true);
	});
});
