import { describe, expect, it, vi } from "vitest";
import { registerWithEmailPassword } from "@/server/actions/auth";
import { prisma } from "@/server/prisma";
import { createAdminClient } from "@/server/supabase/server";

vi.mock("@/server/supabase/server", async () => {
	const actual = await vi.importActual<
		typeof import("@/server/supabase/server")
	>("@/server/supabase/server");

	return {
		...actual,
		createClient: actual.createAnonClient,
	};
});

const basePassword = "Password123!";
const hasRequiredEnv =
	!!process.env.SUPABASE_URL &&
	!!process.env.SUPABASE_ANON_KEY &&
	!!process.env.DATABASE_URL;

const makeEmail = (suffix: string) => `integration+${suffix}@example.test`;

const deleteAuthUserIfPossible = async (userId: string | null) => {
	if (!userId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
	const admin = createAdminClient();
	await admin.auth.admin.deleteUser(userId);
};

describe("auth registration integration", () => {
	const itIfEnv = hasRequiredEnv ? it : it.skip;
	const itIfRateLimit =
		process.env.E2E_RATE_LIMIT_TEST === "1" ? itIfEnv : it.skip;

	itIfEnv("creates a user row and returns expected payload", async () => {
		const email = makeEmail(`${Date.now()}-create`);
		const result = await registerWithEmailPassword({
			email,
			password: basePassword,
			firstName: "Integration",
			lastName: "User",
			accountType: "organization",
			organizationName: "Test Org",
			organizationPosition: "Lead",
			organizationPhone: "123456",
		});

		expect(result.ok).toBe(true);
		expect("needsConfirmation" in result).toBe(true);

		const user = await prisma.user.findUnique({ where: { email } });
		expect(user).not.toBeNull();
		expect(user?.first_name).toBe("Integration");
		expect(user?.last_name).toBe("User");

		await prisma.user.delete({ where: { email } });
		await deleteAuthUserIfPossible(user?.id ?? null);
	});

	itIfEnv("returns expected error for duplicate email", async () => {
		const email = makeEmail(`${Date.now()}-duplicate`);
		const first = await registerWithEmailPassword({
			email,
			password: basePassword,
		});
		if (!first.ok) {
			expect(first.error).toBe("unavailable");
			return;
		}

		const second = await registerWithEmailPassword({
			email,
			password: basePassword,
		});
		if (second.ok) {
			expect(second).toEqual({ ok: true, needsConfirmation: true });
		} else {
			expect(second.error).toBe("unavailable");
		}

		const user = await prisma.user.findUnique({ where: { email } });
		await prisma.user.delete({ where: { email } });
		await deleteAuthUserIfPossible(user?.id ?? null);
	});

	itIfRateLimit("returns expected response for rate limiting", async () => {
		const email = makeEmail(`${Date.now()}-rate-limit`);
		let lastResult: Awaited<
			ReturnType<typeof registerWithEmailPassword>
		> | null = null;

		for (let i = 0; i < 10; i += 1) {
			lastResult = await registerWithEmailPassword({
				email: `${i}-${email}`,
				password: basePassword,
			});
		}

		expect(lastResult).not.toBeNull();
		expect(lastResult?.ok).toBeDefined();
	});
});
