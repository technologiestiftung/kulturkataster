import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InstitutionDraftIntroModal } from "@/components/Institution/InstitutionDraftIntroModal";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key.replace(/^content\./, ""),
	}),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("InstitutionDraftIntroModal", () => {
	beforeEach(() => {
		pushMock.mockReset();
		replaceMock.mockReset();
		useInstitutionDraftStore.getState().resetDraft();
	});

	it("authenticated user can continue with new location flow", () => {
		render(
			<InstitutionDraftIntroModal routePath="/institution" isAuthenticated />,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "institutionDraftIntroModal.intro.cta",
			}),
		);

		expect(useInstitutionDraftStore.getState().mode).toBe("create");
		expect(replaceMock).toHaveBeenCalledWith("/de/institution/submission");
	});

	it("authenticated user can select existing location flow", () => {
		render(
			<InstitutionDraftIntroModal routePath="/institution" isAuthenticated />,
		);

		fireEvent.click(
			screen.getByLabelText("institutionDraftIntroModal.intro.mode.edit"),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "institutionDraftIntroModal.intro.cta",
			}),
		);

		expect(useInstitutionDraftStore.getState().mode).toBe("update");
		expect(replaceMock).toHaveBeenCalledWith(
			"/de/institution/submission/select",
		);
	});

	it("guest user can choose guest path and then select contribution mode", () => {
		render(
			<InstitutionDraftIntroModal
				routePath="/institution"
				isAuthenticated={false}
			/>,
		);

		expect(
			screen.getByRole("button", {
				name: "institutionDraftIntroModal.choice.guest.cta",
			}),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", {
				name: "institutionDraftIntroModal.choice.guest.cta",
			}),
		);

		expect(
			screen.getByText("institutionDraftIntroModal.intro.sectionTitle"),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("institutionDraftIntroModal.intro.mode.new"),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("institutionDraftIntroModal.intro.mode.edit"),
		).toBeInTheDocument();
	});
});
