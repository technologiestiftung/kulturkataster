import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ListView from "@/components/ListView/ListView";
import type { Institution } from "@/types";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = "/de/list";

type InstitutionStoreState = {
	filteredInstitutions: Institution[] | null;
	setFilters: ReturnType<typeof vi.fn>;
	resetFilters: ReturnType<typeof vi.fn>;
	filters: Record<string, unknown>;
	categoryCounts: Record<string, number>;
	subcategoryCounts: Record<string, number>;
	categories: Array<{
		id: number;
		name: string;
		key: string;
		subcategories: [];
	}> | null;
	districts: string[];
	initializeCategories: ReturnType<typeof vi.fn>;
	initializeDistricts: ReturnType<typeof vi.fn>;
};

const storeState: InstitutionStoreState = {
	filteredInstitutions: [],
	setFilters: vi.fn(),
	resetFilters: vi.fn(),
	filters: {},
	categoryCounts: {},
	subcategoryCounts: {},
	categories: [{ id: 1, key: "theater", name: "Theater", subcategories: [] }],
	districts: ["Mitte"],
	initializeCategories: vi.fn(),
	initializeDistricts: vi.fn(),
};

const mockScrollToIndex = vi.fn();
const mockMeasure = vi.fn();
const mockMeasureElement = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	usePathname: () => mockPathname,
}));

vi.mock("@/lib/hooks/useLocalePath", () => ({
	useLocalePath: () => (path: string) => `/de${path}`,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { count?: number }) =>
			key === "listView.countLabel" && typeof options?.count === "number"
				? `${options.count}`
				: key,
	}),
}));

vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (
		selector?: (state: InstitutionStoreState) => unknown,
	) => (selector ? selector(storeState) : storeState),
}));

vi.mock("@tanstack/react-virtual", () => ({
	useWindowVirtualizer: () => ({
		getVirtualItems: () =>
			(storeState.filteredInstitutions ?? []).map((_, index) => ({
				index,
				start: index * 320,
				size: 320,
			})),
		getTotalSize: () => (storeState.filteredInstitutions?.length ?? 0) * 320,
		scrollToIndex: mockScrollToIndex,
		scrollToOffset: vi.fn(),
		measureElement: mockMeasureElement,
		measure: mockMeasure,
	}),
}));

vi.mock("@/components/ListView/InstitutionCard", () => ({
	InstitutionCard: ({
		institutionData,
		onClick,
		isSelected,
		openDetails,
	}: {
		institutionData: Institution;
		onClick: (institution: Institution) => void;
		isSelected: boolean;
		openDetails: boolean;
	}) => (
		<button
			type="button"
			data-testid={`institution-card-${institutionData.id}`}
			data-institution-card-id={String(institutionData.id)}
			aria-selected={isSelected}
			data-open-details={openDetails}
			onClick={() => onClick(institutionData)}
		>
			{institutionData.name}
		</button>
	),
}));

vi.mock("@/components/ListView/AlphabetFilter", () => ({
	AlphabetFilter: () => null,
}));

vi.mock("@/components/ListView/ListTopbar", () => ({
	ListTopbar: ({
		query,
		onQueryChange,
	}: {
		query: string;
		onQueryChange: (value: string) => void;
	}) => (
		<input
			aria-label="query"
			value={query}
			onChange={(event) => onQueryChange(event.target.value)}
		/>
	),
}));

vi.mock("@/components/Content/TextWithLinks", () => ({
	default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/components/Modals/ModalFooter", () => ({
	ModalFooter: () => null,
}));

vi.mock("@/components/Filter/FilterModalWrapper", () => ({
	FilterModalWrapper: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/Filter/FilterPanel", () => ({
	FilterPanel: () => null,
}));

vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	TooltipContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		iconSize: _iconSize,
		radius: _radius,
		variant: _variant,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		iconSize?: string;
		radius?: string;
		variant?: string;
	}) => (
		<button type="button" {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ListView/ListViewSkeleton", () => ({
	ListViewSkeleton: () => <div data-testid="listview-skeleton">loading</div>,
}));

vi.mock("@/icons/arrow-narrow-up.svg", () => ({
	default: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

const makeInstitution = (id: number, name: string): Institution =>
	({
		id,
		name,
		address: {
			street: "Street",
			street_number: "1",
			zipcode: "10115",
			city: "Berlin",
			district: "Mitte",
			neighbourhood: "Mitte",
		},
	}) as unknown as Institution;

describe("ListView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		mockPathname = "/de/list";
		storeState.filteredInstitutions = [
			makeInstitution(1, "Alpha"),
			makeInstitution(2, "Beta"),
			makeInstitution(3, "Gamma"),
		];
		// jsdom shim
		window.scrollTo = vi.fn();
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});
		Object.defineProperty(window, "pageYOffset", {
			writable: true,
			value: 0,
		});
		window.sessionStorage.clear();
	});

	it("renders skeleton when institutions are not loaded", () => {
		storeState.filteredInstitutions = null;
		render(<ListView />);
		expect(screen.getByTestId("listview-skeleton")).toBeInTheDocument();
	});

	it("selects and deselects by route and click", () => {
		const { rerender } = render(<ListView />);

		fireEvent.click(screen.getByTestId("institution-card-1"));
		expect(mockPush).toHaveBeenCalledWith("/de/list/institution/1");

		mockPathname = "/de/list/institution/1";
		rerender(<ListView />);

		const selectedCard = screen.getByTestId("institution-card-1");
		expect(selectedCard).toHaveAttribute("aria-selected", "true");
		expect(selectedCard).toHaveAttribute("data-open-details", "true");

		fireEvent.click(selectedCard);
		expect(mockPush).toHaveBeenCalledWith("/de/list");
	});

	it("syncs selected route to virtualizer index", () => {
		mockPathname = "/de/list/institution/2";
		render(<ListView />);
		expect(mockScrollToIndex).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ align: "center", behavior: "auto" }),
		);
	});

	it("shows and uses scroll-to-top button", () => {
		vi.useFakeTimers();
		render(<ListView />);

		Object.defineProperty(window, "pageYOffset", {
			writable: true,
			value: 500,
		});
		act(() => {
			window.dispatchEvent(new Event("scroll"));
			vi.advanceTimersByTime(150);
		});

		const button = screen.getByLabelText("listView.scrollToTop");
		fireEvent.click(button);

		expect(window.scrollTo).toHaveBeenCalledWith(
			expect.objectContaining({ top: 0 }),
		);
	});
});
