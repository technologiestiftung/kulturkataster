import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessibilitySettingsRedirect } from "@/app/[locale]/accessibilitySettings/AccessibilitySettingsRedirect";

const replaceMock = vi.fn();
const isMobileState = {
	value: false,
};

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		replace: replaceMock,
	}),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => isMobileState.value,
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

describe("AccessibilitySettingsRedirect", () => {
	beforeEach(() => {
		replaceMock.mockReset();
		isMobileState.value = false;
	});

	it("does not redirect on desktop", async () => {
		render(<AccessibilitySettingsRedirect />);

		await waitFor(() => {
			expect(replaceMock).not.toHaveBeenCalled();
		});
	});

	it("redirects mobile visitors to the mobile menu route", async () => {
		isMobileState.value = true;

		render(<AccessibilitySettingsRedirect />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/de/mobileMenu");
		});
	});
});
