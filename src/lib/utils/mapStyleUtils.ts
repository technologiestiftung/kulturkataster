import styleList from "@/config/resources/style";
import { FeatureLike } from "ol/Feature";
import { getCenter } from "ol/extent";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import { Circle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

interface StyleConfig {
	polygonStrokeWidth?: number;
	polygonStrokeColor?: number[];
	polygonFillColor?: number[];
	pointRadius?: number;
	pointFillColor?: number[];
	pointStrokeColor?: number[];
	pointStrokeWidth?: number;
	icon?: string;
	iconScale?: number;
	labelField?: string;
	labelFont?: string;
	labelFillColor?: string;
	labelStrokeColor?: string;
	labelStrokeWidth?: number;
}

export const DEFAULT_STYLE = new Style({
	stroke: new Stroke({ color: "#3b82f6", width: 2 }),
	fill: new Fill({ color: "rgba(59, 130, 246, 0.1)" }),
});

export const getStyleConfig = (styleId: string): StyleConfig | null => {
	return styleList.find((s) => s.styleId === styleId)?.rules[0]?.style || null;
};

const createImageStyle = (config: StyleConfig) => {
	if (config.icon) {
		return new Icon({
			src: config.icon,
			crossOrigin: "anonymous",
			scale: config.iconScale || 1,
			anchor: [0.5, 0.5],
			anchorXUnits: "fraction",
			anchorYUnits: "fraction",
		});
	}

	return new Circle({
		radius: config.pointRadius || 5,
		fill: new Fill({ color: config.pointFillColor || [255, 0, 0, 0.8] }),
		stroke: new Stroke({
			color: config.pointStrokeColor || [255, 0, 0, 1],
			width: config.pointStrokeWidth || 1,
		}),
	});
};

const createLabelStyle = (feature: FeatureLike, config: StyleConfig) => {
	if (!config.labelField) return null;

	const textValue = feature.get(config.labelField);
	if (!textValue) return null;

	return new Style({
		text: new Text({
			text: String(textValue),
			font: config.labelFont || "bold 13px sans-serif",
			fill: new Fill({ color: config.labelFillColor || "#222" }),
			stroke: new Stroke({
				color: config.labelStrokeColor || "#fff",
				width: config.labelStrokeWidth || 3,
			}),
			overflow: true,
		}),
		geometry: (feat: FeatureLike) => {
			const geom = feat.getGeometry();
			if (!geom || typeof geom.getExtent !== "function") return undefined;
			return new Point(getCenter(geom.getExtent()));
		},
	});
};

const createBackgroundCircle = (config: StyleConfig) => {
	if (!config.icon || (!config.pointFillColor && !config.pointStrokeColor)) {
		return null;
	}

	return new Style({
		image: new Circle({
			radius: config.pointRadius || 12,
			fill: new Fill({ color: config.pointFillColor || [255, 255, 255, 0.8] }),
			stroke: new Stroke({
				color: config.pointStrokeColor || [0, 0, 0, 1],
				width: config.pointStrokeWidth || 2,
			}),
		}),
	});
};

export function createOLStyle(config: StyleConfig) {
	return (feature: FeatureLike, resolution: number, index?: number) => {
		const styles: Style[] = [];

		const bgCircle = createBackgroundCircle(config);
		if (bgCircle) styles.push(bgCircle);

		styles.push(
			new Style({
				fill: new Fill({ color: config.polygonFillColor || [0, 0, 0, 0] }),
				stroke: new Stroke({
					color: config.polygonStrokeColor || [0, 0, 0, 1],
					width: config.polygonStrokeWidth || 1,
				}),
				image: createImageStyle(config),
			}),
		);

		if (index === undefined || index === 0) {
			const labelStyle = createLabelStyle(feature, config);
			if (labelStyle) styles.push(labelStyle);
		}

		return styles.length === 1 ? styles[0] : styles;
	};
}

export const applyStyleToLayer = (
	layer: VectorLayer<VectorSource>,
	styleId: string,
): boolean => {
	const config = getStyleConfig(styleId);
	if (!config) {
		reportClientTelemetry({
			level: "warn",
			event: "map.style.not_found",
			metadata: {
				style_id: styleId,
			},
		});
		return false;
	}

	layer.setStyle(createOLStyle(config));
	return true;
};
