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
			create: vi.fn(),
			findUnique: vi.fn(),
		},
		role: {
			findFirst: vi.fn(),
		},
	},
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedCreate = vi.mocked(prisma.user.create);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedRoleFindFirst = vi.mocked(prisma.role.findFirst);

describe("registerWithEmailPassword", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedCreate.mockReset();
		mockedFindUnique.mockReset();
		mockedRoleFindFirst.mockReset();
	});

	it("returns needsConfirmation for already-registered signUp errors", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: { user: null, session: null },
			error: { message: "User already registered" },
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
		});

		expect(result).toEqual({ ok: true, needsConfirmation: true });
		expect(mockedCreate).not.toHaveBeenCalled();
	});

	it("returns standardized unavailable error for non-duplicate signUp failures", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: { user: null, session: null },
			error: { message: "Upstream is down" },
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
		});

		expect(result).toEqual({
			ok: false,
			error: "unavailable",
		});
		expect(mockedCreate).not.toHaveBeenCalled();
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
		mockedFindUnique.mockResolvedValueOnce(null as never);
		mockedRoleFindFirst.mockResolvedValue({ id: 7 } as never);
		mockedCreate.mockResolvedValue({} as never);

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
			firstName: "Test",
			lastName: "User",
			accountType: "organization",
		});

		expect(result).toEqual({ ok: true, needsConfirmation: true });
		expect(mockedCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					id: "user-1",
					email: "test@example.com",
					status: "approval_pending",
					role: { connect: { id: 7 } },
				}),
			}),
		);
	});

	it("assigns guest role by default when available", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: { id: "user-guest", email: "guest@example.com" },
				session: null,
			},
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);
		mockedFindUnique.mockResolvedValueOnce(null as never);
		mockedRoleFindFirst.mockResolvedValue({ id: 7 } as never);
		mockedCreate.mockResolvedValue({} as never);

		const result = await registerWithEmailPassword({
			email: "guest@example.com",
			password: "password123",
		});

		expect(result).toEqual({ ok: true, needsConfirmation: true });
		expect(mockedCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					role: { connect: { id: 7 } },
				}),
			}),
		);
	});

	it("returns needsConfirmation when user create collides with unique constraint", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: { id: "user-2", email: "test@example.com" },
				session: null,
			},
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);
		mockedFindUnique.mockResolvedValueOnce(null as never);
		mockedRoleFindFirst.mockResolvedValue({ id: 7 } as never);
		mockedCreate.mockRejectedValue({ code: "P2002" });

		const result = await registerWithEmailPassword({
			email: "test@example.com",
			password: "password123",
		});

		expect(result).toEqual({ ok: true, needsConfirmation: true });
	});

	it("does not create app user when profile already exists", async () => {
		const signUp = vi.fn().mockResolvedValue({
			data: {
				user: { id: "existing-user", email: "existing@example.com" },
				session: { access_token: "token" },
			},
			error: null,
		});
		mockedCreateClient.mockResolvedValue({ auth: { signUp } } as never);
		mockedFindUnique.mockResolvedValueOnce({ id: "existing-user" } as never);

		const result = await registerWithEmailPassword({
			email: "existing@example.com",
			password: "password123",
		});

		expect(result).toEqual({ ok: true, needsConfirmation: false });
		expect(mockedCreate).not.toHaveBeenCalled();
	});
});

describe("loginWithEmailPassword", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedCreate.mockReset();
		mockedFindUnique.mockReset();
		mockedRoleFindFirst.mockReset();
	});

	it("returns invalid_credentials when Supabase signIn fails", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: null },
			error: { message: "Invalid credentials" },
		});
		mockedCreateClient.mockResolvedValue({
			auth: { signInWithPassword },
		} as never);

		const result = await loginWithEmailPassword("test@example.com", "bad");

		expect(result).toEqual({ ok: false, error: "invalid_credentials" });
	});

	it("returns invalid_credentials and signs out when user profile is missing", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: { id: "missing-profile" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });
		mockedCreateClient.mockResolvedValue({
			auth: { signInWithPassword, signOut },
		} as never);
		mockedFindUnique.mockResolvedValue(null as never);

		const result = await loginWithEmailPassword("test@example.com", "ok");

		expect(result).toEqual({ ok: false, error: "invalid_credentials" });
		expect(signOut).toHaveBeenCalled();
	});

	it("returns banned when user is banned and signs out", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });
		mockedCreateClient.mockResolvedValue({
			auth: { signInWithPassword, signOut },
		} as never);
		mockedFindUnique.mockResolvedValue({
			id: "user-1",
			status: "banned",
		} as never);

		const result = await loginWithEmailPassword("test@example.com", "ok");

		expect(result).toEqual({ ok: false, error: "banned" });
		expect(signOut).toHaveBeenCalled();
	});

	it("returns ok with approvalPending=true when profile is approval_pending", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: { id: "user-1" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });
		mockedCreateClient.mockResolvedValue({
			auth: { signInWithPassword, signOut },
		} as never);
		mockedFindUnique.mockResolvedValue({
			id: "user-1",
			status: "approval_pending",
		} as never);

		const result = await loginWithEmailPassword("test@example.com", "ok");

		expect(result).toEqual({ ok: true, approvalPending: true });
		expect(signOut).not.toHaveBeenCalled();
	});

	it("returns ok with approvalPending=false for active users", async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({
			data: { user: { id: "user-2" } },
			error: null,
		});
		const signOut = vi.fn().mockResolvedValue({ error: null });
		mockedCreateClient.mockResolvedValue({
			auth: { signInWithPassword, signOut },
		} as never);
		mockedFindUnique.mockResolvedValue({
			id: "user-2",
			status: "active",
		} as never);

		const result = await loginWithEmailPassword("test@example.com", "ok");

		expect(result).toEqual({ ok: true, approvalPending: false });
		expect(signOut).not.toHaveBeenCalled();
	});
});
