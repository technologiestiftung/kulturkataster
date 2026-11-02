import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureCollection, Point as GeoPoint } from "geojson";
import Feature from "ol/Feature";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import Cluster from "ol/source/Cluster";
import config from "@/config/config.json";
import InstitutionLayer from "@/components/Map/Layers/InstitutionLayer";

const resolutions = [...config.portalConfig.map.mapView.options]
	.sort((a, b) => a.zoomLevel - b.zoomLevel)
	.map((o) => o.resolution);

type FakeMap = ReturnType<typeof createFakeMap>;
const state = vi.hoisted(() => ({
	map: null as unknown,
	config: null as unknown,
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/de/map" }));
vi.mock("@/server/actions/categoryIcons", () => ({
	getCategoryIconFetchCandidates: vi.fn(async () => []),
}));
vi.mock("@/lib/store/mapStore", () => ({
	useMapStore: (selector: (s: typeof state) => unknown) => selector(state),
}));
vi.mock("@/lib/store/institutionStore", () => ({
	useInstitutionStore: (selector: (s: unknown) => unknown) =>
		selector({ filters: { culture_index_ranges: [] } }),
}));
vi.mock("@/lib/store/appStore", () => ({
	useAppStore: () => ({ isContrastMode: false, isLargeTextMode: false }),
}));

// Same view the app builds in OlMap.tsx: resolutions from config, zoom 0..11.
function createFakeMap() {
	const view = new View({
		projection: "EPSG:3857",
		center: [1497700, 6891900],
		resolutions,
		minZoom: 0,
		maxZoom: resolutions.length - 1,
		constrainResolution: true,
		zoom: resolutions.length - 1,
	});
	const layers: VectorLayer[] = [];
	const clickHandlers: ((e: unknown) => void)[] = [];
	let featuresAtPixel: Feature[] = [];
	return {
		view,
		layers,
		setFeaturesAtPixel: (f: Feature[]) => (featuresAtPixel = f),
		click: (e: unknown) => clickHandlers.forEach((h) => h(e)),
		getView: () => view,
		addLayer: (l: VectorLayer) => layers.push(l),
		removeLayer: () => undefined,
		on: (_t: string, h: (e: unknown) => void) => clickHandlers.push(h),
		un: () => undefined,
		getFeaturesAtPixel: () => featuresAtPixel,
	};
}

// 15 places on the RAW-Gelände (Revaler Str., Friedrichshain), all within ~150 m.
const RAW_CENTER = [13.4545, 52.5075];
const rawPlaces: FeatureCollection<GeoPoint> = {
	type: "FeatureCollection",
	features: Array.from({ length: 15 }, (_, i) => ({
		type: "Feature",
		id: i + 1,
		geometry: {
			type: "Point",
			coordinates: [
				RAW_CENTER[0] + ((i % 5) - 2) * 0.0004,
				RAW_CENTER[1] + (Math.floor(i / 5) - 1) * 0.0003,
			],
		},
		properties: { id: i + 1, categories: [] },
	})),
};

const institutionsLayer = (map: FakeMap) =>
	map.layers.find((l) => l.get("id") === "institutions")!;

// Places represented by what the layer currently draws (marker = 1, bubble = its count).
function renderedPlaceCounts(map: FakeMap) {
	const layer = institutionsLayer(map);
	const source = layer.getSource()!;
	if (source instanceof Cluster) {
		const extent = map.view.calculateExtent([4000, 4000]);
		source.loadFeatures(
			extent,
			map.view.getResolution()!,
			map.view.getProjection(),
		);
		return source
			.getFeatures()
			.map((f) => (f.get("features") as Feature[]).length);
	}
	return source.getFeatures().map(() => 1);
}

describe("InstitutionLayer – RAW-Gelände: all places at every zoom", () => {
	let map: FakeMap;

	beforeEach(() => {
		document.documentElement.style.fontSize = "16px";
		map = createFakeMap();
		state.map = map;
		state.config = config;
		render(<InstitutionLayer institutions={rawPlaces} />);
	});
	afterEach(() => {
		document.documentElement.style.fontSize = "";
	});

	it("does not declutter (hide) pins or cluster bubbles", () => {
		expect(institutionsLayer(map).getDeclutter()).toBeFalsy();
	});

	it.each([11, 10, 9, 8, 7, 6, 5, 4, 3])(
		"zoom %i: markers + bubble counts equal all 15 places",
		(zoom) => {
			act(() => map.view.setZoom(zoom));
			const counts = renderedPlaceCounts(map);
			expect(counts.reduce((a, b) => a + b, 0)).toBe(15);
		},
	);

	it("fans out (no clustering) only at the max zoom", () => {
		act(() => map.view.setZoom(11));
		expect(institutionsLayer(map).getSource()).not.toBeInstanceOf(Cluster);
		act(() => map.view.setZoom(10));
		expect(institutionsLayer(map).getSource()).toBeInstanceOf(Cluster);
	});

	it.each([10, 9, 8, 7, 3, 0])(
		"zoom %i: cluster distance is never below one pin width (40px)",
		(zoom) => {
			act(() => map.view.setZoom(zoom));
			const source = institutionsLayer(map).getSource() as Cluster;
			expect(source.getDistance()).toBeGreaterThanOrEqual(40);
		},
	);

	it("clicking a bubble zooms up to the max (fan-out) zoom", () => {
		act(() => map.view.setZoom(5));
		const fit = vi.spyOn(map.view, "fit").mockImplementation(() => undefined);
		const cluster = new Feature({
			features: (institutionsLayer(map).getSource() as Cluster)
				.getSource()!
				.getFeatures(),
		});
		map.setFeaturesAtPixel([cluster]);
		map.click({ pixel: [0, 0], preventDefault() {}, stopPropagation() {} });
		expect(fit).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ maxZoom: 11 }),
		);
	});
});
