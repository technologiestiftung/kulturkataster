"use client";

import { FC } from "react";
import LayerInitializer from "./LayerInitializer/LayerInitializer";
import { VectorLayer } from "./Layers";
import MapLayers from "./Layers/MapLayers";
import LayerTree from "./LayerTree/LayerTree";
import OlMap from "./Map/OlMap";

// TODO:

// services müssen via id aus der services json ausgelesen und in die config integriert werden
// Layer müssen nach type angelegt werden, d.h. es müssen dem wrapper der type und der layer übergeben werden
// dieser händelt dann welche logik und layer art implementiert werden muss.
// die reihenfolge muss eingehalten werden
// wir unterscheiden zwischen baselayer und subject layer
// types sind erstmal NUR WMS und WFS
// alle Map bezogenen Ding müssen in dem Map Ordner erfolgen!!! damit es für andere Projekte übernommen werden kann
// fetch layer with status and type
// map status handling

const Map: FC = () => {
	return (
		<div className="Map-root">
			<LayerTree />
			<OlMap>
				<LayerInitializer />

				{/* NOTE: add extra layers if needed */}
				<MapLayers>
					<VectorLayer />
				</MapLayers>
			</OlMap>
		</div>
	);
};

export default Map;
