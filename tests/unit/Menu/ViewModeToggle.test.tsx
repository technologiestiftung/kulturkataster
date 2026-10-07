import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ViewModeToggle } from "@/components/Menu/ViewModeToggle";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/icons/burger-menu-icon.svg", () => ({ default: () => null }));
vi.mock("@/icons/clipboard.svg", () => ({ default: () => null }));

function getQuestionnaireButton() {
	return screen.getByRole("button", {
		name: "content.welcomeModal.questionnaire",
	});
}

describe("ViewModeToggle questionnaire button", () => {
	beforeEach(() => {
		pushMock.mockReset();
	});

	it("renders a bordered button whose background overrides the secondary variant", () => {
		render(<ViewModeToggle />);
		const classes = getQuestionnaireButton().classList;

		expect(classes).toContain("bg-background");
		expect(classes).toContain("border");
		expect(classes).toContain("border-muted-foreground");
		expect(classes).toContain("hover:bg-neutral-5");
		expect(classes).not.toContain("bg-secondary");
		expect(classes).not.toContain("hover:bg-secondary/80");
	});

	it("navigates to the questionnaire when clicked", () => {
		render(<ViewModeToggle />);
		fireEvent.click(getQuestionnaireButton());

		expect(pushMock).toHaveBeenCalledWith("/de/questionnaire");
	});
});
