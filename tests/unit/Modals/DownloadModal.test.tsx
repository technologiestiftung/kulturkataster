import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadModal } from "@/components/Modals/Pages/DownloadModal";

const initializePublicDataMock = vi.fn();
const downloadInstitutionsMock = vi.fn();
const institutionStoreState = {
	initializePublicData: initializePublicDataMock,
	filteredInstitutions: null as Array<{ id: number; name: string }> | null,
	allInstitutions: null as Array<{ id: number; name: string }> | null,
	isLoading: false,
};

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
	FormWrapper: ({
		config,
	}: {
		config: {
			formId?: string;
			showCancel?: boolean;
			cancelLabel?: string;
			onCancel?: () => void;
			submitLabel?: string;
			submitDisabled?: boolean;
			onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
		};
	}) =>
		config.formId === "guest-download-form" ? (
			<div>guest-download-form</div>
		) : (
			<div>
				{config.showCancel ? (
					<button type="button" onClick={config.onCancel}>
						{config.cancelLabel ?? "Cancel"}
					</button>
				) : null}
				<button
					type="button"
					disabled={config.submitDisabled}
					onClick={() => void config.onSubmit?.({})}
				>
					{config.submitLabel ?? "Submit"}
				</button>
			</div>
		),
}));

vi.mock("@/lib/utils/downloadUtils", () => ({
	DEFAULT_INSTITUTION_EXPORT_COLUMN_ORDER: ["name"],
	downloadInstitutions: (...args: unknown[]) =>
		downloadInstitutionsMock(...args),
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
			filteredInstitutions: Array<{ id: number; name: string }> | null;
			allInstitutions: Array<{ id: number; name: string }> | null;
			isLoading: boolean;
		}) => unknown,
	) => selector(institutionStoreState),
}));

vi.mock("@/components/Modals/useRoutedModalClose", () => ({
	useRoutedModalClose: () => vi.fn(),
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
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
		institutionStoreState.filteredInstitutions = null;
		institutionStoreState.allInstitutions = null;
		institutionStoreState.isLoading = false;
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
			screen.getByRole("checkbox", {
				name: /Ich habe den rechtlichen Hinweis gelesen und verstanden/i,
			}),
		);
		expect(downloadButton).toBeEnabled();
	});

	it("renders linked consent copy above the action buttons and hides newsletter for logged-in users", () => {
		render(<DownloadModal routePath="/download" isAuthenticated />);

		const termsLink = screen.getByRole("link", {
			name: "rechtlichen Hinweis",
		});
		const acknowledgementCheckbox = screen.getByRole("checkbox", {
			name: /Ich habe den rechtlichen Hinweis gelesen und verstanden/i,
		});
		const downloadButton = screen.getByRole("button", {
			name: "Liste herunterladen",
		});

		expect(termsLink).toHaveAttribute("href", "/de/terms");
		expect(
			screen.queryByRole("link", {
				name: "Newsletter abonnieren.",
			}),
		).not.toBeInTheDocument();
		expect(
			acknowledgementCheckbox.compareDocumentPosition(downloadButton) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).not.toBe(0);
	});

	it("shows newsletter opt-in for guest users", () => {
		render(<DownloadModal routePath="/download" />);

		const newsletterLink = screen.getByRole("link", {
			name: "Newsletter abonnieren.",
		});

		expect(newsletterLink).toHaveAttribute("href", "/de/newsletter");
		expect(newsletterLink).not.toHaveAttribute("target");
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
			screen.getByRole("checkbox", {
				name: /Ich habe den rechtlichen Hinweis gelesen und verstanden/i,
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

	it("uses filtered institutions before all institutions in the public flow", () => {
		institutionStoreState.filteredInstitutions = [
			{ id: 1, name: "Filtered Institution" },
		];
		institutionStoreState.allInstitutions = [
			{ id: 2, name: "All Institution" },
		];

		render(<DownloadModal routePath="/download" isAuthenticated />);

		fireEvent.click(
			screen.getByRole("checkbox", {
				name: /Ich habe den rechtlichen Hinweis gelesen und verstanden/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Liste herunterladen",
			}),
		);

		expect(downloadInstitutionsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: [{ id: 1, name: "Filtered Institution" }],
			}),
		);
	});
});
