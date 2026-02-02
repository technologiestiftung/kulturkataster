import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerWithEmailPassword } from "@/server/actions/auth";
import { createClient } from "@/server/supabase/server";
import { prisma } from "@/server/prisma";

vi.mock("@/server/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/server/prisma", () => ({
	prisma: {
		user: {
			upsert: vi.fn(),
		},
	},
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedUpsert = vi.mocked(prisma.user.upsert);

describe("registerWithEmailPassword", () => {
	beforeEach(() => {
		mockedCreateClient.mockReset();
		mockedUpsert.mockReset();
	});

	it("returns a standardized error when Supabase signUp fails", async () => {
		const signUp = vi
			.fn()
			.mockResolvedValue({
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
