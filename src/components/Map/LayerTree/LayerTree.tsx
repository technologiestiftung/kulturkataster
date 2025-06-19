"use client";

import { useMapStore } from "@/lib/store/mapStore";

const LayerTree = () => {
	const layers = useMapStore((state) => state.layers);
	const setLayerVisibility = useMapStore((state) => state.setLayerVisibility);

	const subjectLayers = layers.filter((l) => l.layerType === "subject");

	return (
		<div>
			<h3>Themen-Layer</h3>
			<ul>
				{subjectLayers.map((layer) => (
					<li key={layer.id}>
						<input
							type="checkbox"
							checked={layer.visibility}
							onChange={(e) => setLayerVisibility(layer.id, e.target.checked)}
						/>
						{layer.config.service.name}
					</li>
				))}
			</ul>
		</div>
	);
};

export default LayerTree;
