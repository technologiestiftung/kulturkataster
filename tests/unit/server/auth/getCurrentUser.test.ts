import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, getCurrentProfile } from "@/server/actions/auth";
import { createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";

vi.mock("@/server/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/server/prisma", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

describe("getCurrentUser", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedFindUnique.mockReset();
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

describe("getCurrentProfile", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedFindUnique.mockReset();
	});

	it("returns null when no Supabase user", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: null },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { getUser } } as never);

		const result = await getCurrentProfile();

		expect(result).toBeNull();
	});

	it("returns profile when present", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { getUser } } as never);
		mockedFindUnique.mockResolvedValue({
			id: "user-1",
			status: "active",
		} as never);

		const result = await getCurrentProfile();

		expect(result).toEqual({ id: "user-1", status: "active" });
	});
});
