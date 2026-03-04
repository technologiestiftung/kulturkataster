import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
	redirect: redirectMock,
}));

describe("account dashboard routing integration", () => {
	it("/account redirects to /account/activity", async () => {
		const pageModule = await import("@/app/[locale]/account/(dashboard)/page");

		await pageModule.default({
			params: Promise.resolve({ locale: "de" }),
		});

		expect(redirectMock).toHaveBeenCalledWith("/de/account/activity");
	});
});
