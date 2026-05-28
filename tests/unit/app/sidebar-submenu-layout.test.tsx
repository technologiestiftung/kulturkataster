import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SubmenuLayout from "@/app/[locale]/@sidebar/(submenu)/layout";

const pushMock = vi.fn();
const backMock = vi.fn();
const pathnameState = {
	value: "/de/map/institution/42",
};

vi.mock("next/navigation", () => ({
	usePathname: () => pathnameState.value,
	useRouter: () => ({
		push: pushMock,
		back: backMock,
	}),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			(
				({
					"common.back": "Zuruck",
					"common.closeSidebar": "Seitenleiste schliessen",
					"common.institution.details": "Details",
					"common.accessibility.title": "Barrierefreiheit",
				}) as const
			)[key] ?? key,
	}),
}));

vi.mock("@/icons/arrow-narrow-left.svg", () => ({
	default: () => null,
}));

describe("SubmenuLayout", () => {
	beforeEach(() => {
		pushMock.mockReset();
		backMock.mockReset();
		pathnameState.value = "/de/map/institution/42";
		window.history.replaceState({}, "", "/");
	});

	it("renders the institution sidebar header on desktop routes", () => {
		render(
			<SubmenuLayout>
				<div>Content</div>
			</SubmenuLayout>,
		);

		expect(screen.getByText("Details")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Zuruck" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Seitenleiste schliessen" }),
		).toBeInTheDocument();
	});

	it("uses the accessibility title for accessibility sidebar routes", () => {
		pathnameState.value = "/de/accessibilitySettings";

		render(
			<SubmenuLayout>
				<div>Content</div>
			</SubmenuLayout>,
		);

		expect(screen.getByText("Barrierefreiheit")).toBeInTheDocument();
	});

	it("falls back to the localized map route when no browser history entry exists", () => {
		render(
			<SubmenuLayout>
				<div>Content</div>
			</SubmenuLayout>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Seitenleiste schliessen" }),
		);

		expect(backMock).not.toHaveBeenCalled();
		expect(pushMock).toHaveBeenCalledWith("/de/map");
	});

	it("uses browser back when a history entry is available", () => {
		window.history.replaceState({ idx: 2 }, "", "/de/map/institution/42");

		render(
			<SubmenuLayout>
				<div>Content</div>
			</SubmenuLayout>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Zuruck" }));

		expect(backMock).toHaveBeenCalledTimes(1);
		expect(pushMock).not.toHaveBeenCalled();
	});
});
