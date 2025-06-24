"use client";

import { useMapStore } from "@/lib/store/mapStore";
import { Zoom } from "ol/control";
import { FC, useEffect } from "react";

const ZoomControl: FC = () => {
	const map = useMapStore((state) => state.map);

	useEffect(() => {
		if (!map) return;

		const zoomControl = new Zoom();
		map.addControl(zoomControl);

		return () => {
			map.removeControl(zoomControl);
		};
	}, [map]);

	return null;
};

export default ZoomControl;
