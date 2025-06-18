"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { LayerElement } from "@/types";
import { FC, useEffect, useState } from "react";
import { VectorLayer } from "./Layers";
import MapLayer from "./Layers/MapLayer";
import MapLayers from "./Layers/MapLayers";
import OlMap from "./Map/OlMap";

// TODO:

// config mit layer types
// services müssen via id aus der services json ausgelesen und in die config integriert werden
// Layer müssen nach type angelegt werden, d.h. es müssen dem wrapper der type und der layer übergeben werden
// dieser händelt dann welche logik und layer art implementiert werden muss.
// die reihenfolge muss eingehalten werden
// wir unterscheiden zwischen baselayer und subject layer
// types sind erstmal NUR WMS und WFS
// alle Map bezogenen Ding müssen in dem Map Ordner erfolgen!!! damit es für andere Projekte übernommen werden kann

const Map: FC = () => {
	const config = useMapStore((state) => state.config);
	const [baseLayer, setBaseLayer] = useState<LayerElement[] | null>(null);
	console.log("[Map] config::", config);

	useEffect(() => {
		if (!config) return;

		console.log("[Map] config.layerConfig::", config.layerConfig);
		console.log(
			"[Map] config.layerConfig::",
			config.layerConfig.baselayer.elements,
		);

		setBaseLayer(config.layerConfig.baselayer.elements);
	}, [config]);

	return (
		<div className="Map-root">
			<OlMap>
				<MapLayers>
					{baseLayer &&
						baseLayer.map((layer, index) => (
							<MapLayer key={index} type={layer.type} layer={layer} />
						))}

					{/* {config!.layers[0] && (
            <TileLayer
              url={config!.layers[0].url}
              params={config!.layers[0].params}
              name="WMS-Layer"
            />
          )} */}
					{/* <TileLayer
            url={config!.layers[0].url}
            params={config!.layers[0].params}
            name="WMS-Layer"
          /> */}
					<VectorLayer />
				</MapLayers>
			</OlMap>
		</div>
	);
};

export default Map;
