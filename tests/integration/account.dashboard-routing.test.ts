import { describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
	redirectMock: vi.fn((path: string) => {
		throw new Error(`NEXT_REDIRECT:${path}`);
	}),
}));

vi.mock("next/navigation", () => ({
	redirect: redirectMock,
}));

describe("account dashboard routing integration", () => {
	it("/account redirects to /account/activity", async () => {
		const pageModule = await import("@/app/[locale]/account/(dashboard)/page");

		await expect(
			pageModule.default({
				params: Promise.resolve({ locale: "de" }),
			}),
		).rejects.toThrow("NEXT_REDIRECT:/de/account/activity");

		expect(redirectMock).toHaveBeenCalledWith("/de/account/activity");
	});
});
