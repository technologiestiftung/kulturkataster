import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Map from "@/components/Map/Map";
import { useAppStore } from "@/lib/store/appStore";

const { pathnameMock, isMobileMock } = vi.hoisted(() => ({
	pathnameMock: vi.fn(() => "/de/map"),
	isMobileMock: vi.fn(() => false),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: isMobileMock,
}));

vi.mock("next/navigation", () => ({
	usePathname: pathnameMock,
}));

vi.mock("next/dynamic", () => ({
	default: () =>
		function LazyOlMapMock({ children }: { children: React.ReactNode }) {
			return <>{children}</>;
		},
}));

vi.mock("@/components/Map/LayerTree/LayerTree", () => ({
	default: ({ isSidePanelOpen }: { isSidePanelOpen?: boolean }) => (
		<div
			data-testid="layer-tree"
			data-side-panel-open={String(isSidePanelOpen)}
		/>
	),
}));

// The filter/search side panel stays closed, as after picking a search result.
// It only exposes whether it is blocked and a way to open it.
vi.mock("@/components/Menu/MenuContent/SidePanel", () => ({
	SidePanel: ({
		isBlocked,
		onPanelOpen,
	}: {
		isBlocked?: boolean;
		onPanelOpen?: () => void;
	}) => (
		<button
			type="button"
			data-testid="side-panel"
			data-blocked={String(isBlocked)}
			onClick={onPanelOpen}
		/>
	),
}));

vi.mock("@/components/Map/Controls", () => ({
	ClickControl: () => null,
	HoverControl: () => null,
	MapControls: () => null,
}));

vi.mock("@/components/Map/LayerInitializer/LayerInitializer", () => ({
	default: () => null,
}));

vi.mock("@/components/Map/Layers", () => ({
	InstitutionLayer: () => null,
	Layers: () => null,
}));

vi.mock("@/components/HoverCard/HoverCard", () => ({ default: () => null }));

vi.mock(
	"@/components/Map/Controls/MapNavigation/MapNavigationControls",
	() => ({ default: () => null }),
);

const isLayerTreeShiftedRight = () =>
	screen.getByTestId("layer-tree").dataset.sidePanelOpen === "true";

describe("Map", () => {
	beforeEach(() => {
		pathnameMock.mockReturnValue("/de/map");
		isMobileMock.mockReturnValue(false);
		act(() => useAppStore.getState().setIsLayerTreeOpen(false));
	});

	it("keeps the layer tree at the left edge when no sidebar is open", () => {
		render(<Map />);

		expect(isLayerTreeShiftedRight()).toBe(false);
	});

	it("moves the layer tree next to the institution detail sidebar", () => {
		pathnameMock.mockReturnValue("/de/map/institution/1130");

		render(<Map />);

		expect(isLayerTreeShiftedRight()).toBe(true);
	});

	it("moves the layer tree next to the accessibility settings sidebar", () => {
		pathnameMock.mockReturnValue("/de/accessibilitySettings");

		render(<Map />);

		expect(isLayerTreeShiftedRight()).toBe(true);
	});

	it("keeps the filter panel and Fachkarten open together on desktop", () => {
		act(() => useAppStore.getState().setIsLayerTreeOpen(true));
		render(<Map />);

		expect(screen.getByTestId("side-panel").dataset.blocked).toBe("false");
		fireEvent.click(screen.getByTestId("side-panel"));
		expect(useAppStore.getState().isLayerTreeOpen).toBe(true);
	});

	it("allows only one of filter panel and Fachkarten on mobile", () => {
		isMobileMock.mockReturnValue(true);
		act(() => useAppStore.getState().setIsLayerTreeOpen(true));
		render(<Map />);

		expect(screen.getByTestId("side-panel").dataset.blocked).toBe("true");
		fireEvent.click(screen.getByTestId("side-panel"));
		expect(useAppStore.getState().isLayerTreeOpen).toBe(false);
	});
});
