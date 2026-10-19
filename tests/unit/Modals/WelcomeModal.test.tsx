import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WelcomeModal } from "@/components/Modals/Pages/WelcomeModal";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
	usePathname: () => "/de/welcome",
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Modals/ModalFooter", () => ({
	ModalFooter: () => null,
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/icons/arrow-narrow-right.svg", () => ({ default: () => null }));
vi.mock("@/icons/close.svg", () => ({ default: () => null }));
vi.mock("@/icons/chevron-left.svg", () => ({ default: () => null }));
vi.mock("@/logos/KRB.svg", () => ({ default: () => null }));
vi.mock("@/logos/kuka-large.svg", () => ({ default: () => null }));
vi.mock("@/logos/kuka-small.svg", () => ({ default: () => null }));
vi.mock("@/logos/senate.svg", () => ({ default: () => null }));

const questionnaireLink = () =>
	screen.queryByRole("link", { name: "content.welcomeModal.questionnaire" });

describe("WelcomeModal questionnaire link", () => {
	it("links to the questionnaire while one is open", () => {
		render(<WelcomeModal showQuestionnaire />);

		expect(questionnaireLink()).toHaveAttribute("href", "/questionnaire");
	});

	it("is hidden while no questionnaire is open", () => {
		render(<WelcomeModal showQuestionnaire={false} />);

		expect(questionnaireLink()).toBeNull();
		expect(
			screen.getByText("content.welcomeModal.description2"),
		).toBeInTheDocument();
	});
});
