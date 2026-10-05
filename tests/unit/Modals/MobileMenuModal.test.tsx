import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileMenuModal } from "@/components/Modals/Pages/MobileMenuModal";
import { ViewModeToggle } from "@/components/Menu/ViewModeToggle";

const pushMock = vi.fn();
const navigationState = { pathname: "/de/list" };

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, back: vi.fn() }),
	usePathname: () => navigationState.pathname,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Menu/MenuContent/AccessibilityContent", () => ({
	AccessibilityContent: () => null,
}));

vi.mock("@/components/Modals/ModalFooter", () => ({
	ModalFooter: () => null,
}));

vi.mock("@/icons/burger-menu-icon.svg", () => ({ default: () => null }));
vi.mock("@/icons/clipboard.svg", () => ({ default: () => null }));
vi.mock("@/icons/close.svg", () => ({ default: () => null }));
vi.mock("@/icons/download.svg", () => ({ default: () => null }));
vi.mock("@/icons/info-circle.svg", () => ({ default: () => null }));
vi.mock("@/icons/lang/de.svg", () => ({ default: () => null }));
vi.mock("@/icons/lang/en.svg", () => ({ default: () => null }));
vi.mock("@/icons/list.svg", () => ({ default: () => null }));
vi.mock("@/icons/map.svg", () => ({ default: () => null }));
vi.mock("@/logos/KRB.svg", () => ({ default: () => null }));

describe("MobileMenuModal language toggle", () => {
	beforeEach(() => {
		pushMock.mockReset();
	});

	it("switches the language of the page the menu was opened from", () => {
		window.history.pushState({}, "", "/de/list?view=compact");
		render(<ViewModeToggle />);
		fireEvent.click(
			screen.getByRole("button", { name: "common.mobileMenu.title" }),
		);
		expect(pushMock).toHaveBeenLastCalledWith("/de/mobileMenu");

		navigationState.pathname = "/de/mobileMenu";
		render(<MobileMenuModal />);
		fireEvent.click(
			screen.getByRole("button", { name: /common\.language\.title/ }),
		);

		expect(pushMock).toHaveBeenLastCalledWith("/en/list?view=compact");
	});
});
