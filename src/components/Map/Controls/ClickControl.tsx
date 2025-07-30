/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMapStore } from "@/lib/store/mapStore";
import { useVenueStore } from "@/lib/store/venueStore";
import { FeatureLike } from "ol/Feature";
import { FC, useEffect } from "react";

interface ClickControlProps {
	layerId: string;
}

function extractVenueId(feature: any): string | null {
	return feature?.get?.("id") || feature?.values_?.ID || null;
}

function findClickedVenueId(clickedFeature: FeatureLike): string | null {
	const features = clickedFeature.get("features");

	if (features?.length > 1) return null;

	const targetFeature = features?.[0] || clickedFeature;

	return extractVenueId(targetFeature);
}

const ClickControl: FC<ClickControlProps> = ({ layerId }) => {
	const map = useMapStore((state) => state.map);
	const setSelectedVenueId = useVenueStore((state) => state.setSelectedVenueId);

	useEffect(() => {
		if (!map) return;

		map.on("singleclick", function (evt) {
			const pixel = evt.pixel;

			map.forEachFeatureAtPixel(pixel, function (_feature, layer) {
				const _layerId = layer.get("id");
				const _layerName = layer.get("name");

				const isVenuesLayer = _layerId === "venues" || _layerName === "venues";

				if (isVenuesLayer) {
					const venueId = findClickedVenueId(_feature);
					setSelectedVenueId(venueId);
				}

				return true;
			});
		});
	}, [map, layerId, setSelectedVenueId]);
	return null;
};

export default ClickControl;
