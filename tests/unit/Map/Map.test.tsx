import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Map from "@/components/Map/Map";

const { pathnameMock } = vi.hoisted(() => ({
	pathnameMock: vi.fn(() => "/de/map"),
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
vi.mock("@/components/Menu/MenuContent/SidePanel", () => ({
	SidePanel: () => null,
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
});
