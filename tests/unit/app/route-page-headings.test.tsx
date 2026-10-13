import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MapLayout from "@/app/[locale]/map/layout";
import AccessibilitySettingsPage from "@/app/[locale]/accessibilitySettings/page";

vi.mock("@/i18n", () => ({
	serverSideTranslation: async (locale: string) => ({
		t: (key: string) => `${locale}:${key}`,
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

const params = Promise.resolve({ locale: "de" });

describe("route page headings", () => {
	it("gives every /map route a level-1 heading, even when the page renders nothing", async () => {
		// Detail routes like /map/institution/[id] render a null page.
		render(await MapLayout({ children: null, params }));

		expect(
			screen.getByRole("heading", { level: 1, name: "de:common.map.title" }),
		).toBeInTheDocument();
	});

	it("keeps child content inside the map layout", async () => {
		render(await MapLayout({ children: <p>detail</p>, params }));

		expect(screen.getByText("detail")).toBeInTheDocument();
		expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
	});

	it("gives the accessibility settings page a level-1 heading", async () => {
		render(await AccessibilitySettingsPage({ params }));

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "de:common.a11y.shell.pageTitle.accessibilitySettings",
			}),
		).toBeInTheDocument();
	});
});
