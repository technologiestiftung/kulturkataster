import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAuthUserWithDbUser,
	getCurrentUser,
	requireAuth,
} from "@/server/actions/auth";
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

describe("requireAuth", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedFindUnique.mockReset();
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

		const result = await requireAuth();

		expect(result).toBeNull();
	});

	it("returns null and signs out when user is not active", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });

		mockedCreateClient.mockResolvedValue({
			auth: { getUser, signOut },
		} as never);
		mockedFindUnique.mockResolvedValue({ id: "user-1", status: "inactive" } as never);

		const result = await requireAuth();

		expect(result).toBeNull();
		expect(signOut).toHaveBeenCalled();
	});

	it("returns user when status is active", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({
			auth: { getUser },
		} as never);
		mockedFindUnique.mockResolvedValue({ id: "user-1", status: "active" } as never);

		const result = await requireAuth();

		expect(result).toEqual({ id: "user-1" });
	});
});

describe("getAuthUserWithDbUser", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedFindUnique.mockReset();
	});

	it("returns nulls when no Supabase user", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: null },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { getUser } } as never);

		const result = await getAuthUserWithDbUser();

		expect(result.user).toBeNull();
		expect(result.dbUser).toBeNull();
	});

	it("returns user and dbUser when present", async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { getUser } } as never);
		mockedFindUnique.mockResolvedValue({ id: "user-1", status: "active" } as never);

		const result = await getAuthUserWithDbUser();

		expect(result.user).toEqual({ id: "user-1" });
		expect(result.dbUser).toEqual({ id: "user-1", status: "active" });
	});
});
