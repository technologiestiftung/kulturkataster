import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";

const initializePublicDataMock = vi.fn();
const downloadInstitutionsMock = vi.fn();

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

vi.mock("@/lib/utils/downloadUtils", () => ({
	DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER: ["name"],
	downloadInstitutions: (...args: unknown[]) => downloadInstitutionsMock(...args),
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
		downloadInstitutionsMock.mockReset();
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
				"Die Liste Ihrer Kulturorte können Sie hier in verschiedenen Dateiformaten herunterladen.",
			),
		).toBeInTheDocument();
		expect(initializePublicDataMock).toHaveBeenCalledTimes(1);
	});

	it("preselects xls and keeps the download button disabled until acknowledged", () => {
		render(<DownloadModal routePath="/download" isAuthenticated />);

		const downloadButton = screen.getByRole("button", {
			name: "Liste herunterladen",
		});
		expect(screen.getByRole("button", { name: "XLS" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(downloadButton).toBeDisabled();

		fireEvent.click(
			screen.getByRole("radio", {
				name: "Ich habe die rechtlichen Hinweise gelesen und verstanden",
			}),
		);
		expect(downloadButton).toBeEnabled();
	});

	it("allows changing the selected format", () => {
		render(<DownloadModal routePath="/download" isAuthenticated />);

		fireEvent.click(screen.getByRole("button", { name: "XLSX" }));

		expect(screen.getByRole("button", { name: "XLSX" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "XLS" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("downloads the selected format", async () => {
		render(<DownloadModal routePath="/download" isAuthenticated />);

		fireEvent.click(screen.getByRole("button", { name: "CSV" }));
		fireEvent.click(
			screen.getByRole("radio", {
				name: "Ich habe die rechtlichen Hinweise gelesen und verstanden",
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Liste herunterladen",
			}),
		);

		expect(downloadInstitutionsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				format: "csv",
			}),
		);
	});
});
