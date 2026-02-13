"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { Circle as CircleStyle, Fill, Style } from "ol/style";
import { fromLonLat, toLonLat } from "ol/proj";
import "ol/ol.css";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { getMaptilerKey, reverseGeocode } from "@/server/actions/maptiler";
import { Button } from "@/components/ui/button";

type AddressMapValue = {
	lat: number | null;
	lng: number | null;
};

type AddressMapSelection = {
	lat: number;
	lng: number;
};

type AddressMapAddress = {
	street?: string | null;
	streetNumber?: string | null;
	city?: string | null;
	zipcode?: string | null;
};

type AddressMapFieldProps = {
	value: AddressMapValue;
	onChange: (payload: {
		lat: number;
		lng: number;
		address?: AddressMapAddress;
	}) => void;
	disabled?: boolean;
	initialZoom?: number;
};

const DEFAULT_CENTER: [number, number] = [13.405, 52.52];

export function AddressMapField({
	value,
	onChange,
	disabled = false,
	initialZoom = 15,
}: AddressMapFieldProps) {
	const { t } = useTranslation("common");
	const mapRef = useRef<HTMLDivElement | null>(null);
	const mapInstance = useRef<Map | null>(null);
	const markerSource = useRef<VectorSource | null>(null);
	const markerFeature = useRef<Feature<Point> | null>(null);
	const [mapError, setMapError] = useState<string | null>(null);
	const [maptilerKey, setMaptilerKey] = useState<string | null>(null);
	const [pendingSelection, setPendingSelection] =
		useState<AddressMapSelection | null>(null);
	const [isApplyingSelection, setIsApplyingSelection] = useState(false);
	const isUserMove = useRef(false);
	const moveEndTimeout = useRef<number | null>(null);
	const onChangeRef = useRef(onChange);
	const disabledRef = useRef(disabled);

	const setMarker = useCallback((lng: number, lat: number) => {
		if (!markerSource.current) return;
		const point = new Point(fromLonLat([lng, lat]));
		if (!markerFeature.current) {
			markerFeature.current = new Feature(point);
			markerSource.current.addFeature(markerFeature.current);
		} else {
			markerFeature.current.setGeometry(point);
		}
	}, []);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		disabledRef.current = disabled;
	}, [disabled]);

	useEffect(() => {
		let active = true;
		const loadKey = async () => {
			try {
				const key = await getMaptilerKey();
				if (!active) return;
				if (!key) {
					setMapError("MapTiler API key is missing.");
					return;
				}
				setMaptilerKey(key);
			} catch (error) {
				if (active) {
					setMapError("Failed to load MapTiler API key.");
				}
				console.warn("Failed to load MapTiler key:", error);
			}
		};
		if (!maptilerKey && !mapError) {
			loadKey();
		}
		return () => {
			active = false;
		};
	}, [mapError, maptilerKey]);

	useEffect(() => {
		if (!mapRef.current || mapInstance.current) return;
		if (!maptilerKey) return;

		const initMap = () => {
			const tileLayer = new TileLayer({
				source: new XYZ({
					url: `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${maptilerKey}`,
					attributions:
						'<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
				}),
			});

			markerSource.current = new VectorSource();
			const markerLayer = new VectorLayer({
				source: markerSource.current,
				style: new Style({
					image: new CircleStyle({
						radius: 4,
						fill: new Fill({ color: "#000" }),
					}),
				}),
			});

			const initialCenter =
				value.lat !== null && value.lng !== null
					? [value.lng, value.lat]
					: DEFAULT_CENTER;

			const view = new View({
				center: fromLonLat(initialCenter),
				zoom: initialZoom,
				minZoom: 3,
				maxZoom: 20,
			});

			const map = new Map({
				target: mapRef.current!,
				layers: [tileLayer, markerLayer],
				view,
				controls: [],
			});

			let resizeRaf = 0;
			const lastSize = { width: 0, height: 0 };
			const resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (!entry) return;
				const { width, height } = entry.contentRect;
				if (width === lastSize.width && height === lastSize.height) return;
				lastSize.width = width;
				lastSize.height = height;
				if (resizeRaf) cancelAnimationFrame(resizeRaf);
				resizeRaf = requestAnimationFrame(() => {
					map.updateSize();
				});
			});
			resizeObserver.observe(mapRef.current!);
			requestAnimationFrame(() => {
				map.updateSize();
			});

			return { map, resizeObserver, getResizeRaf: () => resizeRaf };
		};

		const { map, resizeObserver, getResizeRaf } = initMap();
		const handlePointerDrag = () => {
			if (disabledRef.current) return;
			if (moveEndTimeout.current) {
				clearTimeout(moveEndTimeout.current);
				moveEndTimeout.current = null;
			}
			isUserMove.current = true;
		};

		const handleMoveEnd = async () => {
			if (disabledRef.current) return;
			if (!isUserMove.current) return;
			if (moveEndTimeout.current) {
				clearTimeout(moveEndTimeout.current);
			}
			moveEndTimeout.current = window.setTimeout(async () => {
				isUserMove.current = false;
				const center = map.getView().getCenter();
				if (!center) return;
				const [lng, lat] = toLonLat(center);
				setMarker(lng, lat);
				setPendingSelection({ lat, lng });
			}, 300);
		};

		map.on("pointerdrag", handlePointerDrag);
		map.on("moveend", handleMoveEnd);

		mapInstance.current = map;

		return () => {
			resizeObserver.disconnect();
			const resizeRaf = getResizeRaf();
			if (resizeRaf) cancelAnimationFrame(resizeRaf);
			map.un("pointerdrag", handlePointerDrag);
			map.un("moveend", handleMoveEnd);
			if (moveEndTimeout.current) {
				clearTimeout(moveEndTimeout.current);
				moveEndTimeout.current = null;
			}
			map.setTarget(undefined);
			mapInstance.current = null;
		};
	}, [initialZoom, maptilerKey, setMarker]);

	useEffect(() => {
		if (!mapInstance.current) return;
		if (value.lat === null || value.lng === null) return;
		setMarker(value.lng, value.lat);
		const view = mapInstance.current.getView();
		const nextCenter = fromLonLat([value.lng, value.lat]);
		const currentCenter = view.getCenter();
		if (
			currentCenter &&
			Math.abs(currentCenter[0] - nextCenter[0]) < 0.01 &&
			Math.abs(currentCenter[1] - nextCenter[1]) < 0.01
		) {
			return;
		}
		view.setCenter(nextCenter);
	}, [setMarker, value.lat, value.lng]);

	const handleApplySelection = useCallback(async () => {
		if (disabled || !pendingSelection || isApplyingSelection) return;
		setIsApplyingSelection(true);
		try {
			const address = await reverseGeocode(
				pendingSelection.lat,
				pendingSelection.lng,
			);
			onChangeRef.current({
				lat: pendingSelection.lat,
				lng: pendingSelection.lng,
				address: address ?? undefined,
			});
		} catch (error) {
			console.warn("Reverse geocode failed", error);
			onChangeRef.current({
				lat: pendingSelection.lat,
				lng: pendingSelection.lng,
			});
		} finally {
			setPendingSelection(null);
			setIsApplyingSelection(false);
		}
	}, [disabled, isApplyingSelection, pendingSelection]);

	if (mapError) {
		return (
			<div className="rounded-sm border border-input bg-neutral-5 px-4 py-3 body2 text-foreground">
				{mapError}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<span className="body2 text-foreground mb-1 block">
				{t("map.addressPickerHint")}
			</span>
			<div
				className={cn(
					"relative w-full overflow-hidden rounded-sm border border-input",
					disabled && "pointer-events-none opacity-60",
				)}
			>
				<div ref={mapRef} className="h-56 w-full grayscale" />
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-2 w-2 rounded-full bg-primary-dark" />
				</div>
			</div>
			<div className="flex justify-end">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => void handleApplySelection()}
					disabled={disabled || !pendingSelection || isApplyingSelection}
				>
					{isApplyingSelection
						? t("map.addressPickerApplyLoading")
						: t("map.addressPickerApply")}
				</Button>
			</div>
		</div>
	);
}
