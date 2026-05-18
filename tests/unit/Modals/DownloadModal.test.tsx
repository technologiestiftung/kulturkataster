import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";

const initializePublicDataMock = vi.fn();

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string; count?: number }) =>
			options?.defaultValue ?? key,
	}),
}));

vi.mock("@/components/Modals/Modal", () => ({
	Modal: ({
		children,
		title,
		subtitle,
	}: {
		children: React.ReactNode;
		title?: React.ReactNode;
		subtitle?: React.ReactNode;
	}) => (
		<div>
			<div>{title}</div>
			<div>{subtitle}</div>
			{children}
		</div>
	),
}));

vi.mock("@/components/FormWrapper/FormWrapper", () => ({
	FormWrapper: () => <div>guest-download-form</div>,
}));

vi.mock("@/lib/store/accountStore", () => ({
	useAccountStore: (
		selector: (state: { currentProfile: { id: string } | null }) => unknown,
	) =>
		selector({
			currentProfile: { id: "stale-profile" },
		}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector: (state: {
			initializePublicData: () => void;
			filteredInstitutions: null;
			allInstitutions: null;
			isLoading: boolean;
		}) => unknown,
	) =>
		selector({
			initializePublicData: initializePublicDataMock,
			filteredInstitutions: null,
			allInstitutions: null,
			isLoading: false,
		}),
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => vi.fn(),
}));

vi.mock("@/server/actions/downloads", () => ({
	notifyInstitutionDownload: vi.fn(),
}));

vi.mock("@/icons/arrow-narrow-right.svg", () => ({
	default: () => <div data-testid="arrow-icon" />,
}));

describe("DownloadModal", () => {
	beforeEach(() => {
		initializePublicDataMock.mockReset();
	});

	it("shows the guest form in the public download flow even if a stale profile exists", () => {
		render(<DownloadModal routePath="/download" />);

		expect(screen.getByText("guest-download-form")).toBeInTheDocument();
		expect(initializePublicDataMock).toHaveBeenCalledTimes(1);
	});

	it("hides the guest form in the public download flow for authenticated users", () => {
		render(<DownloadModal routePath="/download" isAuthenticated />);

		expect(screen.queryByText("guest-download-form")).not.toBeInTheDocument();
		expect(
			screen.getByText(
				"Die Liste ihrer Kulturorte können Sie hier als Excel Tabelle herunterladen.",
			),
		).toBeInTheDocument();
		expect(initializePublicDataMock).toHaveBeenCalledTimes(1);
	});
});
