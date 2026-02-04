import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	loginWithEmailPassword,
	registerWithEmailPassword,
} from "@/server/actions/auth";
import { createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";

vi.mock("@/server/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/server/prisma", () => ({
	prisma: {
		user: {
			upsert: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedUpsert = vi.mocked(prisma.user.upsert);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

describe("registerWithEmailPassword", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedUpsert.mockReset();
		mockedFindUnique.mockReset();
	});

	it("returns a standardized error when Supabase signUp fails", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: { user: null, session: null },
			error: { message: "Duplicate email" },
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
		});

		expect(result).toEqual({ ok: false, error: "Duplicate email" });
		expect(mockedUpsert).not.toHaveBeenCalled();
	});

	it("creates a user row and returns needsConfirmation when no session is returned", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: { id: "user-1", email: "test@example.com" },
				session: null,
			},
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);
		mockedUpsert.mockResolvedValue({} as never);

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
			firstName: "Test",
			lastName: "User",
			accountType: "organization",
		});

		expect(result).toEqual({ ok: true, needsConfirmation: true });
		expect(mockedUpsert).toHaveBeenCalled();
	});

	it("returns a standardized error when user creation fails", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: { id: "user-2", email: "test@example.com" },
				session: null,
			},
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);
		mockedUpsert.mockRejectedValue(new Error("User creation failed."));

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
		});

		expect(result).toEqual({ ok: false, error: "User creation failed." });
	});
});

describe("loginWithEmailPassword", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedUpsert.mockReset();
		mockedFindUnique.mockReset();
	});

	it("returns error when Supabase signIn fails", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: null },
			error: { message: "Invalid credentials" },
		});
		mockedCreateClient.mockResolvedValue({
			auth: { signInWithPassword },
		} as never);

		const result = await loginWithEmailPassword("test@example.com", "bad");

		expect(result).toEqual({ ok: false, error: "Invalid credentials" });
	});

	it("returns inactive when user is not active and signs out", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient
			.mockResolvedValueOnce({
			auth: { signInWithPassword, signOut },
		} as never)
			.mockResolvedValueOnce({
				auth: { getUser },
			} as never);
		mockedFindUnique.mockResolvedValue({ id: "user-1", status: "inactive" } as never);

		const result = await loginWithEmailPassword("test@example.com", "ok");

		expect(result).toEqual({ ok: false, error: "inactive" });
		expect(signOut).toHaveBeenCalled();
	});

	it("returns ok when user is active", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		mockedCreateClient
			.mockResolvedValueOnce({
			auth: { signInWithPassword, signOut },
		} as never)
			.mockResolvedValueOnce({
				auth: { getUser },
			} as never);
		mockedFindUnique.mockResolvedValue({ id: "user-1", status: "active" } as never);

		const result = await loginWithEmailPassword("test@example.com", "ok");

		expect(result).toEqual({ ok: true });
		expect(signOut).not.toHaveBeenCalled();
	});
});
