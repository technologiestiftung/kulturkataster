/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { useMapStore } from "@/lib/store/mapStore";
import { FeatureLike } from "ol/Feature";
import { FC, useEffect } from "react";

interface ClickControlProps {
	layerId: string;
}

function extractInstitutionId(feature: any): string | null {
	return feature?.get?.("id") || feature?.values_?.ID || null;
}

function findClickedInstitutionId(clickedFeature: FeatureLike): string | null {
	const features = clickedFeature.get("features");

	if (features?.length > 1) return null;

	const targetFeature = features?.[0] || clickedFeature;

	return extractInstitutionId(targetFeature);
}

const ClickControl: FC<ClickControlProps> = ({ layerId }) => {
	const map = useMapStore((state) => state.map);
	const setSelectedInstitutionId = useInstitutionStore(
		(state) => state.setSelectedInstitutionId,
	);

	useEffect(() => {
		if (!map) return;

		map.on("singleclick", function (evt) {
			const pixel = evt.pixel;

			map.forEachFeatureAtPixel(pixel, function (_feature, layer) {
				const _layerId = layer.get("id");
				const _layerName = layer.get("name");

				const isInstitutionsLayer =
					_layerId === "institutions" || _layerName === "institutions";

				if (isInstitutionsLayer) {
					const institutionId = findClickedInstitutionId(_feature);
					setSelectedInstitutionId(institutionId);
				}

				return true;
			});
		});
	}, [map, layerId, setSelectedInstitutionId]);
	return null;
};

export default ClickControl;
