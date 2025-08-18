"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/components/ui/sidebar";
import ContextMapIcon from "@/icons/fachkarten.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useMapStore } from "@/lib/store/mapStore";
import { ManagedLayer } from "@/types";
import { X } from "lucide-react";
import Image from "next/image";
import {
	FC,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";

// Constants
const LAYER_THUMBNAIL_SIZE = 80;
const FLOATING_BUTTON_SIZE = 64;
const SIDEBAR_COLLAPSED_OFFSET = "left-24";
const SIDEBAR_EXPANDED_OFFSET = "left-[494px]";
const SIDEBAR_EXPANDED_OFFSET_LARGE_TEXT = "left-[554px]";

// Custom hooks
const useLayerData = () => {
	const layers = useMapStore((state) => state.layers);

	return useMemo(() => {
		const subjectLayers = layers.filter((l) => l.layerType === "subject");
		const visibleSubjectLayers = subjectLayers.filter((l) => l.visibility);

		const topVisibleLayer = visibleSubjectLayers.reduce(
			(topLayer, currentLayer) => {
				return !topLayer || currentLayer.zIndex > topLayer.zIndex
					? currentLayer
					: topLayer;
			},
			null as ManagedLayer | null,
		);

		return {
			subjectLayers,
			visibleSubjectLayers,
			topVisibleLayer,
			visibleCount: visibleSubjectLayers.length,
		};
	}, [layers]);
};

// Memoized LayerThumbnail component
const LayerThumbnail = memo<{
	layer: ManagedLayer;
	size?: number;
	showOverlay?: boolean;
}>(({ layer, size = LAYER_THUMBNAIL_SIZE, showOverlay = false }) => {
	const [imageError, setImageError] = useState(false);

	const previewSrc = layer.config.service.preview?.src;
	const hasPreview = previewSrc && !imageError;

	return (
		<div
			className="rounded overflow-hidden flex-shrink-0 relative"
			style={{ width: size, height: size }}
		>
			{hasPreview ? (
				<Image
					src={previewSrc}
					alt={layer.config.service.name}
					width={size}
					height={size}
					className="w-full h-full object-cover"
					onError={() => setImageError(true)}
				/>
			) : (
				<div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center">
					<div className="w-6 h-6 border-2 border-purple-400 rounded opacity-50" />
				</div>
			)}
			{showOverlay && layer.visibility && (
				<div
					className="absolute inset-0 bg-primary/30 flex items-center justify-center border-2 border-primary rounded"
					aria-hidden="true"
				/>
			)}
		</div>
	);
});

LayerThumbnail.displayName = "LayerThumbnail";

// Memoized LayerItem component
const LayerItem = memo<{
	layer: ManagedLayer;
	onAccordionChange?: (value: string) => void;
}>(({ layer, onAccordionChange }) => {
	const setLayerVisibility = useMapStore((state) => state.setLayerVisibility);
	const accordionContentRef = useRef<HTMLDivElement>(null);

	const handleVisibilityChange = useCallback(
		(checked: boolean) => {
			setLayerVisibility(layer.id, checked);
			if (layer.config.service.legend && onAccordionChange) {
				if (checked) {
					onAccordionChange(layer.id);
				} else {
					onAccordionChange("");
				}
			}
		},
		[
			layer.id,
			setLayerVisibility,
			layer.config.service.legend,
			onAccordionChange,
		],
	);

	const handleAccordionToggle = useCallback(
		(value: string) => {
			if (value === layer.id) {
				setTimeout(() => {
					if (accordionContentRef.current) {
						accordionContentRef.current.scrollIntoView({
							behavior: "smooth",
							block: "nearest",
							inline: "start",
						});
					}
				}, 200);
			}
		},
		[layer.id],
	);

	const hasLegend =
		layer.config.service.legend &&
		typeof layer.config.service.legend === "string";

	const serviceName = layer.config.service.name;
	const serviceNameLang = layer.config.service.name_lang;

	return (
		<AccordionItem
			value={layer.id}
			className={`border-none bg-white rounded-sm ${layer.visibility ? "shadow-sm" : ""}`}
			role="listitem"
		>
			<div className="flex items-center justify-between p-3 m-0">
				<div className="flex items-center space-x-3 flex-1">
					<LayerThumbnail layer={layer} showOverlay />
					<div className="flex flex-col">
						<Label
							htmlFor={layer.id}
							className={`body2 font-bold cursor-pointer flex ${
								layer.visibility ? "text-primary" : ""
							}`}
						>
							{serviceName}
						</Label>
						{serviceNameLang && (
							<div
								className={`body2 ${layer.status === "error" ? "text-alert" : ""}`}
							>
								{layer.status === "error"
									? "Fachkarte nicht verfügbar. Bitte versuchen Sie es später erneut."
									: serviceNameLang}
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center space-x-1">
					<div className="w-11 h-11 flex items-center justify-center">
						<Checkbox
							id={layer.id}
							checked={layer.visibility}
							onCheckedChange={handleVisibilityChange}
							className="w-6 h-6 rounded-full"
							aria-label={`Toggle visibility for ${serviceName}`}
							disabled={layer.status === "error"}
						/>
					</div>
				</div>
			</div>

			{hasLegend && (
				<>
					<AccordionTrigger
						className="px-3 py-2 rounded-none [&[data-state=closed]]:rounded-b-sm hover:no-underline flex justify-end items-center gap-2 [&>svg]:text-black bg-neutral-10"
						aria-label={`Show legend for ${serviceName}`}
						onClick={() => handleAccordionToggle(layer.id)}
					>
						Legende ansehen
					</AccordionTrigger>
					<AccordionContent
						ref={accordionContentRef}
						className="px-3 pb-3 bg-neutral-10 rounded-b-sm"
					>
						<Image
							src={layer.config.service.legend as string}
							alt={`Legend for ${serviceName}`}
							width={300}
							height={50}
							className="h-auto w-full max-w-full rounded"
							loading="lazy"
						/>
					</AccordionContent>
				</>
			)}
		</AccordionItem>
	);
});

LayerItem.displayName = "LayerItem";

// Floating button component
const FloatingLayerButton = memo<{
	visibleCount: number;
	topVisibleLayer: ManagedLayer | null;
	sidebarState: string;
	onClick: () => void;
}>(({ visibleCount, topVisibleLayer, sidebarState, onClick }) => {
	const { isLargeTextMode } = useAppStore();

	const getLeftPosition = useCallback(() => {
		const expandedOffset = isLargeTextMode
			? SIDEBAR_EXPANDED_OFFSET_LARGE_TEXT
			: SIDEBAR_EXPANDED_OFFSET;

		return sidebarState === "collapsed"
			? SIDEBAR_COLLAPSED_OFFSET
			: expandedOffset;
	}, [sidebarState, isLargeTextMode]);

	return (
		<div
			className={`fixed bottom-4 z-50 transition-all duration-200 ${getLeftPosition()}`}
		>
			<div className="relative">
				{visibleCount > 1 && (
					<div
						className="absolute -top-1 left-1 w-16 h-16 bg-primary/70 rounded border-primary"
						aria-hidden="true"
					/>
				)}

				<button
					className={`relative w-16 h-16 p-0 bg-neutral-80 shadow-lg rounded overflow-hidden flex items-center justify-center cursor-pointer transition-colors hover:bg-neutral-70 focus:outline-none ${
						visibleCount > 0 ? "border-2 border-primary" : ""
					}`}
					onClick={onClick}
					aria-label={`Open layer tree (${visibleCount} visible layers)`}
				>
					<div className="w-full h-full flex items-center justify-center">
						{visibleCount === 0 ? (
							<ContextMapIcon className="[&>path]:fill-white" />
						) : (
							topVisibleLayer && (
								<LayerThumbnail
									layer={topVisibleLayer}
									size={FLOATING_BUTTON_SIZE}
								/>
							)
						)}
					</div>
				</button>

				{visibleCount > 0 && (
					<Badge
						variant="default"
						className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full border-2 border-white text-xs font-bold"
						aria-label={`${visibleCount} layers visible`}
					>
						{visibleCount}
					</Badge>
				)}
			</div>
		</div>
	);
});

FloatingLayerButton.displayName = "FloatingLayerButton";

// Main LayerTree component with scroll container support
const LayerTree: FC = () => {
	const { t } = useTranslation("common");
	const { subjectLayers, visibleCount, topVisibleLayer } = useLayerData();
	const setIsLayerTreeOpen = useMapStore((state) => state.setIsLayerTreeOpen);
	const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
	const [isOpen, setIsOpen] = useState(false);
	const [accordionValue, setAccordionValue] = useState<string>("");

	const handleOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	const handleAccordionChange = useCallback((value: string) => {
		setAccordionValue(value);
	}, []);

	useEffect(() => {
		if (isOpen && isMobile) {
			setIsOpen(false);
			setIsLayerTreeOpen(true);
			setOpenMobile(true);
		}
	}, [isMobile, isOpen, setIsLayerTreeOpen, setOpenMobile]);

	if (!isOpen && isMobile) {
		return null;
	}

	if (!isOpen) {
		return (
			<FloatingLayerButton
				visibleCount={visibleCount}
				topVisibleLayer={topVisibleLayer}
				sidebarState={sidebarState}
				onClick={handleOpen}
			/>
		);
	}

	return (
		<Card
			className={`flex w-[400px] max-h-[70vh] absolute bottom-4 z-50 flex-col bg-neutral-5 transition-all duration-200 left-4`}
			role="dialog"
			aria-label={t("map.layerTreeTitle")}
		>
			<CardHeader className="shadow-sm p-1 pl-6">
				<div className="flex items-center justify-between">
					<CardTitle className="body1">{t("map.layerTreeTitle")}</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="w-14 h-14 p-0"
						onClick={handleClose}
						aria-label={t("map.closeLayerTree")}
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-2">
				<LayerTreeContent
					layers={subjectLayers}
					accordionValue={accordionValue}
					onAccordionChange={handleAccordionChange}
				/>
			</CardContent>
		</Card>
	);
};

// Updated LayerTreeContent component with accordion control
export const LayerTreeContent: FC<{
	layers?: ManagedLayer[];
	accordionValue?: string;
	onAccordionChange?: (value: string) => void;
}> = ({ layers: providedLayers, accordionValue, onAccordionChange }) => {
	const { t } = useTranslation("common");
	const { subjectLayers } = useLayerData();
	const layersToRender = providedLayers || subjectLayers;

	if (layersToRender.length === 0) {
		return (
			<div className="flex items-center justify-center py-8 text-muted-foreground">
				<p>{t("map.noLayersAvailable")}</p>
			</div>
		);
	}

	return (
		<Accordion
			type="single"
			collapsible
			value={accordionValue}
			onValueChange={onAccordionChange}
			className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]"
			role="list"
			aria-label={t("map.availableLayers")}
		>
			{layersToRender.map((layer) => (
				<LayerItem
					key={layer.id}
					layer={layer}
					onAccordionChange={onAccordionChange}
				/>
			))}
		</Accordion>
	);
};

export default LayerTree;
