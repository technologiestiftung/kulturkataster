import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { createClient } from "@/server/supabase/server";

vi.mock("@/server/supabase/server", () => ({
	createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("getCurrentUser", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
	});

	it("returns null when Supabase returns no user", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: null },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { getUser } } as never);

		const result = await getCurrentUser();

		expect(result).toBeNull();
	});

	it("returns the Supabase user when present", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { getUser } } as never);

		const result = await getCurrentUser();

		expect(result).toEqual({ id: "user-1" });
	});
});

describe("requireAuth", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		vi.resetModules();
	});

	it("returns null when no Supabase user", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: null },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({
			auth: { getUser },
		} as never);

		const { requireAuth: freshRequireAuth } = await import(
			"@/server/auth/getCurrentUser"
		);
		const result = await freshRequireAuth();

		expect(result).toBeNull();
	});

	it("returns user when status is active", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({
			auth: { getUser },
		} as never);

		const { requireAuth: freshRequireAuth } = await import(
			"@/server/auth/getCurrentUser"
		);
		const result = await freshRequireAuth();

		expect(result).toEqual({ id: "user-1" });
	});
});
