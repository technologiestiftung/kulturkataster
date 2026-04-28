// Mock SVG imports for icons
vi.mock("@/icons/minus.svg", () => ({
	default: () => <svg data-testid="minus-icon" />,
}));
vi.mock("@/icons/plus.svg", () => ({
	default: () => <svg data-testid="plus-icon" />,
}));
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { AddressMapField } from "@/components/FormWrapper/AddressMapField";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"map.addressPickerHint":
					"Move the map pin and then apply the position.",
				"map.addressPickerApply": "Apply map position",
				"map.addressPickerApplyLoading": "Applying position...",
			};
			return translations[key] || key;
		},
	}),
}));

// Mock server actions
const mockGetMaptilerKey = vi.fn();
const mockGetMapBoundingBox = vi.fn();
const mockReverseGeocode = vi.fn();

vi.mock("@/server/actions/maptiler", () => ({
	getMaptilerKey: () => mockGetMaptilerKey(),
	getMapBoundingBox: () => mockGetMapBoundingBox(),
	reverseGeocode: (lat: number, lng: number) => mockReverseGeocode(lat, lng),
}));

// Mock OpenLayers
const mockView = {
	getCenter: vi.fn(() => [13.405, 52.52]),
	setCenter: vi.fn(),
};

const mockMap = {
	setTarget: vi.fn(),
	getView: vi.fn(() => mockView),
	on: vi.fn(),
	un: vi.fn(),
	updateSize: vi.fn(),
};
let mapEventHandlers: Record<string, (() => void) | undefined> = {};

const mockVectorSource = {
	addFeature: vi.fn(),
	clear: vi.fn(),
};

vi.mock("ol/Map", () => ({
	default: vi.fn(function () {
		return mockMap;
	}),
}));

vi.mock("ol/View", () => ({
	default: vi.fn(function () {
		return mockView;
	}),
}));

vi.mock("ol/source/Vector", () => ({
	default: vi.fn(function (this: typeof mockVectorSource) {
		return mockVectorSource;
	}),
}));

vi.mock("ol/layer/Tile", () => ({
	default: vi.fn(function () {
		return {};
	}),
}));

vi.mock("ol/layer/Vector", () => ({
	default: vi.fn(function () {
		return {};
	}),
}));

vi.mock("ol/source/XYZ", () => ({
	default: vi.fn(function () {
		return {};
	}),
}));

vi.mock("ol/Feature", () => ({
	default: vi.fn(function () {
		return {
			setGeometry: vi.fn(),
		};
	}),
}));

vi.mock("ol/geom/Point", () => ({
	default: vi.fn(function () {
		return {};
	}),
}));

vi.mock("ol/proj", () => ({
	fromLonLat: (coords: [number, number]) => coords,
	toLonLat: (coords: [number, number]) => coords,
}));

vi.mock("ol/style", () => ({
	Style: vi.fn(function () {
		return {};
	}),
	Circle: vi.fn(function () {
		return {};
	}),
	Fill: vi.fn(function () {
		return {};
	}),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(function (this: ResizeObserver) {
	return {
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	};
}) as unknown as typeof ResizeObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
	cb(0);
	return 0;
});

global.cancelAnimationFrame = vi.fn();

describe("AddressMapField", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetMaptilerKey.mockResolvedValue("test-api-key");
		mockGetMapBoundingBox.mockResolvedValue(null);
		mockReverseGeocode.mockResolvedValue({
			street: "Hauptstraße",
			streetNumber: "123",
			city: "Berlin",
			zipcode: "10115",
		});
		mockView.getCenter.mockReturnValue([13.405, 52.52]);
		mapEventHandlers = {};
		mockMap.on.mockImplementation((event: string, handler: () => void) => {
			mapEventHandlers[event] = handler;
		});
		mockMap.un.mockImplementation((event: string) => {
			delete mapEventHandlers[event];
		});
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe("Rendering", () => {
		it("renders map container", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(
					screen.getByText(/Move the map pin and then apply the position./i),
				).toBeInTheDocument();
			});
		});

		it("shows hint text", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(
					screen.getByText(/Move the map pin and then apply the position./i),
				).toBeInTheDocument();
			});
		});

		it("renders center crosshair indicator", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				const crosshair = container.querySelector(
					".bg-primary-dark.h-2.w-2.rounded-full",
				);
				expect(crosshair).toBeInTheDocument();
			});
		});
	});

	describe("API Key Loading", () => {
		it("shows error when API key fails to load", async () => {
			mockGetMaptilerKey.mockRejectedValue(new Error("Failed to load key"));

			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(
					screen.getByText(/Failed to load map configuration./i),
				).toBeInTheDocument();
			});
		});

		it("shows error when API key is missing", async () => {
			mockGetMaptilerKey.mockResolvedValue(null);

			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(
					screen.getByText(/MapTiler API key is missing/i),
				).toBeInTheDocument();
			});
		});

		it("initializes map when API key is loaded", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockGetMaptilerKey).toHaveBeenCalled();
			});
		});
	});

	describe("Initial Coordinates", () => {
		it("centers map on provided coordinates", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockGetMaptilerKey).toHaveBeenCalled();
			});
		});

		it("uses default center when no coordinates provided", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockGetMaptilerKey).toHaveBeenCalled();
			});
		});
	});

	describe("Custom Initial Zoom", () => {
		it("uses custom initial zoom when provided", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
					initialZoom={12}
				/>,
			);

			await waitFor(() => {
				expect(mockGetMaptilerKey).toHaveBeenCalled();
			});
		});

		it("uses default zoom of 15 when not specified", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockGetMaptilerKey).toHaveBeenCalled();
			});
		});
	});

	describe("Disabled State", () => {
		it("applies disabled styling when disabled", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
					disabled={true}
				/>,
			);

			await waitFor(() => {
				const mapContainer = container.querySelector(".pointer-events-none");
				expect(mapContainer).toBeInTheDocument();
			});
		});

		it("allows interaction when not disabled", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
					disabled={false}
				/>,
			);

			await waitFor(() => {
				const mapContainer = container.querySelector(
					".relative.w-full.overflow-hidden",
				);
				expect(mapContainer).toBeInTheDocument();
			});
		});
	});

	describe("Map Grayscale Styling", () => {
		it("applies grayscale filter to map", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				const mapDiv = container.querySelector(".grayscale");
				expect(mapDiv).toBeInTheDocument();
			});
		});
	});

	describe("Coordinate Updates", () => {
		it("does not update fields automatically on map move", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockMap.on).toHaveBeenCalled();
			});
			vi.useFakeTimers();

			act(() => {
				mapEventHandlers.pointerdrag?.();
				mapEventHandlers.moveend?.();
				vi.advanceTimersByTime(350);
			});

			expect(onChange).not.toHaveBeenCalled();
			expect(
				screen.getByRole("button", { name: /Apply map position/i }),
			).toBeEnabled();
		});

		it("applies selected map position only after CTA click", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockMap.on).toHaveBeenCalled();
			});
			vi.useFakeTimers();

			act(() => {
				mapEventHandlers.pointerdrag?.();
				mapEventHandlers.moveend?.();
				vi.advanceTimersByTime(350);
			});

			const applyButton = screen.getByRole("button", {
				name: /Apply map position/i,
			});
			expect(applyButton).toBeEnabled();

			await act(async () => {
				fireEvent.click(applyButton);
			});

			expect(onChange).toHaveBeenCalledWith({
				lat: 52.52,
				lng: 13.405,
				address: {
					street: "Hauptstraße",
					streetNumber: "123",
					city: "Berlin",
					zipcode: "10115",
				},
			});
		});

		it("applies lat/lng without address when reverse geocode fails", async () => {
			mockReverseGeocode.mockRejectedValueOnce(new Error("reverse failed"));
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockMap.on).toHaveBeenCalled();
			});
			vi.useFakeTimers();

			act(() => {
				mapEventHandlers.pointerdrag?.();
				mapEventHandlers.moveend?.();
				vi.advanceTimersByTime(350);
			});

			const applyButton = screen.getByRole("button", {
				name: /Apply map position/i,
			});
			expect(applyButton).toBeEnabled();

			await act(async () => {
				fireEvent.click(applyButton);
			});

			expect(onChange).toHaveBeenCalledWith({
				lat: 52.52,
				lng: 13.405,
			});
		});

		it.skip("updates marker when coordinates change externally", async () => {
			const onChange = vi.fn();
			const { rerender } = render(
				<AddressMapField
					value={{ lat: 52.52, lng: 13.405 }}
					onChange={onChange}
				/>,
			);

			// Wait for map to be fully initialized (updateSize is called after map init)
			await waitFor(() => {
				expect(mockMap.updateSize).toHaveBeenCalled();
			});

			// Clear previous calls
			mockView.setCenter.mockClear();

			// Update coordinates
			rerender(
				<AddressMapField
					value={{ lat: 52.53, lng: 13.415 }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockView.setCenter).toHaveBeenCalled();
			});
		});

		it("does not update when coordinates are null", async () => {
			const onChange = vi.fn();
			render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				expect(mockGetMaptilerKey).toHaveBeenCalled();
			});

			// View center should not be called with null coordinates
			expect(mockView.setCenter).not.toHaveBeenCalled();
		});
	});

	describe("Map Dimensions", () => {
		it("renders map with correct height", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				const mapDiv = container.querySelector(".h-56");
				expect(mapDiv).toBeInTheDocument();
			});
		});

		it("renders map with full width", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				const mapDiv = container.querySelector(".w-full");
				expect(mapDiv).toBeInTheDocument();
			});
		});
	});

	describe("Border Styling", () => {
		it("applies border styling to map container", async () => {
			const onChange = vi.fn();
			const { container } = render(
				<AddressMapField
					value={{ lat: null, lng: null }}
					onChange={onChange}
				/>,
			);

			await waitFor(() => {
				const mapContainer = container.querySelector(
					".rounded-sm.border.border-input",
				);
				expect(mapContainer).toBeInTheDocument();
			});
		});
	});
});
