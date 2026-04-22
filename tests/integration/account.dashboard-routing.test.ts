import { describe, expect, it, vi } from "vitest";

const { replaceMock } = vi.hoisted(() => ({
	replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		replace: replaceMock,
	}),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react")>();
	return {
		...actual,
		useEffect: (effect: () => void) => effect(),
	};
});

describe("account dashboard routing integration", () => {
	it("/account redirects to /account/activity", async () => {
		const pageModule = await import("@/app/[locale]/account/(dashboard)/page");

		pageModule.default();

		expect(replaceMock).toHaveBeenCalledWith("/de/account/activity");
	});
});
