"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSidebar } from "@/components/ui/sidebar";
import ContextMapIcon from "@/icons/fachkarten.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useMapStore } from "@/lib/store/mapStore";
import { getAccessibleScrollBehavior } from "@/lib/utils/motion";
import { ManagedLayer } from "@/types";
import X from "@/icons/x.svg";
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
import Legende from "./Legende";

// Constants
const LAYER_THUMBNAIL_SIZE = 80;
const FLOATING_BUTTON_SIZE = 64;
const SIDEBAR_COLLAPSED_OFFSET = "left-4";
const SIDEBAR_EXPANDED_OFFSET = "left-[494px]";
const SIDEBAR_EXPANDED_OFFSET_LARGE_TEXT = "left-[554px]";

const getLayerTreeOffset = (
	isSidePanelOpen: boolean,
	isLargeTextMode: boolean,
) => {
	if (!isSidePanelOpen) {
		return SIDEBAR_COLLAPSED_OFFSET;
	}

	return isLargeTextMode
		? SIDEBAR_EXPANDED_OFFSET_LARGE_TEXT
		: SIDEBAR_EXPANDED_OFFSET;
};

// Custom hooks
const useLayerData = () => {
	const layers = useMapStore((state) => state.layers);
	const setOpenLegendLayerId = useMapStore(
		(state) => state.setOpenLegendLayerId,
	);

	const layerData = useMemo(() => {
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

	useEffect(() => {
		if (layerData.topVisibleLayer) {
			setOpenLegendLayerId(layerData.topVisibleLayer.id);
		}
	}, [layerData.topVisibleLayer, setOpenLegendLayerId]);

	return layerData;
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
					alt=""
					width={size}
					height={size}
					className="w-full h-full object-cover"
					loading={layer.visibility ? "eager" : "lazy"}
					onError={() => setImageError(true)}
				/>
			) : (
				<div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center">
					<div className="w-6 h-6 border-2 border-purple-400 rounded opacity-50" />
				</div>
			)}
			{showOverlay && layer.visibility && (
				<div
					className="absolute inset-0 bg-interaction-dark/30 flex items-center justify-center border-2 border-interaction-dark rounded"
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
}>(({ layer }) => {
	const { t } = useTranslation();
	const setLayerVisibility = useMapStore((state) => state.setLayerVisibility);
	const openLegendLayerId = useMapStore((state) => state.openLegendLayerId);
	const setOpenLegendLayerId = useMapStore(
		(state) => state.setOpenLegendLayerId,
	);
	const accordionContentRef = useRef<HTMLDivElement>(null);

	const handleVisibilityChange = useCallback(
		(newVisibility: boolean) => {
			setLayerVisibility(layer.id, newVisibility);
			if (layer.config.service.legend) {
				if (newVisibility) {
					setOpenLegendLayerId(layer.id);
				}
				if (!newVisibility && openLegendLayerId === layer.id) {
					setOpenLegendLayerId("");
				}
			}
		},
		[
			layer.id,
			layer.config.service.legend,
			openLegendLayerId,
			setLayerVisibility,
			setOpenLegendLayerId,
		],
	);

	useEffect(() => {
		if (openLegendLayerId === layer.id) {
			const timer = setTimeout(() => {
				accordionContentRef.current?.scrollIntoView({
					behavior: getAccessibleScrollBehavior(),
					block: "nearest",
				});
			}, 150);
			return () => clearTimeout(timer);
		}
	}, [openLegendLayerId, layer.id]);

	const serviceName =
		layer.config.service.name?.trim() ||
		t("common.map.unnamedLayer", { defaultValue: "Unbenannte Fachkarte" });
	const serviceNameLang = layer.config.service.name_lang;
	const serviceNameMid = layer.config.service.name_mid;

	return (
		<AccordionItem
			value={layer.id}
			className={`border-none bg-background rounded-sm ${layer.visibility ? "shadow-sm" : ""}`}
			role="listitem"
		>
			<div className="flex items-center justify-between p-3 m-0">
				<Label
					htmlFor={layer.id}
					className="flex items-start space-x-3 flex-1 cursor-pointer"
				>
					<LayerThumbnail layer={layer} showOverlay />
					<div className="flex flex-col">
						<span
							className={`body2 font-bold flex ${
								layer.visibility ? "text-interaction-dark" : ""
							}`}
						>
							{serviceName}
						</span>
						{serviceNameLang && (
							<div
								className={`body2 font-semibold hidden ${layer.status === "error" ? "text-alert" : ""}`}
							>
								{layer.status === "error"
									? "Fachkarte nicht verfügbar. Bitte versuchen Sie es später erneut."
									: serviceNameLang}
							</div>
						)}
						{serviceNameMid && (
							<div
								className={`body2 font-semibold ${layer.status === "error" ? "text-alert" : ""}`}
							>
								{layer.status === "error"
									? "Fachkarte nicht verfügbar. Bitte versuchen Sie es später erneut."
									: serviceNameMid}
							</div>
						)}
					</div>
				</Label>
				<div className="flex items-center space-x-1">
					<div className="w-11 h-11 flex items-center justify-center">
						<Checkbox
							id={layer.id}
							checked={layer.visibility}
							onCheckedChange={handleVisibilityChange}
							className="w-6 h-6 rounded-full border-neutral-80"
							aria-label={t("common.map.layerItemAriaLabel", { serviceName })}
							disabled={layer.status === "error"}
						/>
					</div>
				</div>
			</div>
			<AccordionTrigger
				className="px-3 py-2 rounded-none [&[data-state=closed]]:rounded-b-sm hover:no-underline flex justify-end items-center gap-2 [&>svg]:text-foreground bg-neutral-10"
				aria-label={t("common.map.layerItemLegendAriaLabel", { serviceName })}
			>
				{t("common.map.lookAtLegend")}
			</AccordionTrigger>
			<AccordionContent
				ref={accordionContentRef}
				className="px-3 pb-3 bg-neutral-10 rounded-b-sm"
				role="group"
				aria-label={t("common.map.legend.legendAriaLabels", {
					serviceName,
				})}
				aria-labelledby={undefined}
				aria-describedby={undefined}
			>
				<Legende id={layer.id} serviceName={serviceName} />
			</AccordionContent>
		</AccordionItem>
	);
});

LayerItem.displayName = "LayerItem";

const FloatingLayerButton = memo(
	({
		visibleCount,
		topVisibleLayer,
		isSidePanelOpen,
		onClick,
		forwardedRef,
	}: {
		visibleCount: number;
		topVisibleLayer: ManagedLayer | null;
		isSidePanelOpen: boolean;
		onClick: () => void;
		forwardedRef?: React.RefObject<HTMLButtonElement | null>;
	}) => {
		const { isLargeTextMode } = useAppStore();
		const { t } = useTranslation();
		const offsetClass = getLayerTreeOffset(isSidePanelOpen, isLargeTextMode);

		return (
			<div
				className={`absolute bottom-10 md:block hidden z-25 transition-all duration-200 ${offsetClass}`}
			>
				<div className="relative">
					{visibleCount > 1 && (
						<div
							className="absolute -top-1 left-1 w-16 h-16 bg-interaction-dark/70 rounded border-interaction-dark"
							aria-hidden="true"
						/>
					)}

					<ButtonWithTooltip
						ref={forwardedRef}
						radius="full"
						variant="surface"
						iconSize="lg"
						tooltip={t("common.map.layerTree")}
						tooltipSide="right"
						className={`relative w-16 h-16 p-0 bg-neutral-80 shadow-lg rounded overflow-hidden flex items-center justify-center cursor-pointer transition-colors hover:bg-neutral-70 focus:outline-none ${
							visibleCount > 0 ? "border-2 border-interaction-dark" : ""
						}`}
						onClick={onClick}
						aria-label={t("common.map.layerTreeAriaLabel", { visibleCount })}
					>
						<div className="w-full h-full flex items-center justify-center">
							{visibleCount === 0 ? (
								<ContextMapIcon className="[&>path]:fill-popover" />
							) : (
								topVisibleLayer && (
									<LayerThumbnail
										layer={topVisibleLayer}
										size={FLOATING_BUTTON_SIZE}
									/>
								)
							)}
						</div>
					</ButtonWithTooltip>

					{visibleCount > 0 && (
						<Badge
							variant="default"
							className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full border-2 border-white text-xs font-bold"
							aria-label={t("common.map.layerTreeVisibleCountAriaLabel", {
								visibleCount,
							})}
						>
							{visibleCount}
						</Badge>
					)}
				</div>
			</div>
		);
	},
);

FloatingLayerButton.displayName = "FloatingLayerButton";

// Main LayerTree component (desktop only - mobile handled via Sheet in Menu)
const LayerTree: FC<{
	isSidePanelOpen?: boolean;
}> = ({ isSidePanelOpen = false }) => {
	const { t } = useTranslation();
	const { subjectLayers, visibleCount, topVisibleLayer } = useLayerData();
	const { isMobile } = useSidebar();
	const isLayerTreeOpen = useAppStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useAppStore((state) => state.setIsLayerTreeOpen);
	const isLargeTextMode = useAppStore((state) => state.isLargeTextMode);
	const [isOpen, setIsOpen] = useState(false);
	const floatingButtonRef = useRef<HTMLButtonElement>(null);
	const offsetClass = getLayerTreeOffset(isSidePanelOpen, isLargeTextMode);

	const handleOpen = useCallback(() => {
		setIsLayerTreeOpen(true);
	}, [setIsLayerTreeOpen]);

	const handleClose = useCallback(() => {
		setIsLayerTreeOpen(false);
		setTimeout(() => {
			floatingButtonRef.current?.focus();
		}, 0);
	}, [setIsLayerTreeOpen]);

	useEffect(() => {
		setIsOpen(isLayerTreeOpen);
	}, [isLayerTreeOpen]);

	// Handle Escape key to close the dialog
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleClose]);

	if (!isOpen || isMobile) {
		return (
			<FloatingLayerButton
				visibleCount={visibleCount}
				topVisibleLayer={topVisibleLayer}
				isSidePanelOpen={isSidePanelOpen}
				onClick={handleOpen}
				forwardedRef={floatingButtonRef}
			/>
		);
	}

	return (
		<Card
			className={`flex w-full md:w-[400px] max-h-[70vh] absolute bottom-4 z-50 flex-col bg-neutral-5 transition-all duration-200 ${offsetClass}`}
			role="dialog"
			aria-label={t("common.map.layerTreeTitle")}
		>
			<CardHeader className="shadow-sm p-1 pl-6">
				<div className="flex items-center h-14 justify-between">
					<CardTitle className="body1 font-bold">
						{t("common.map.layerTreeTitle")}
					</CardTitle>
					<Button
						variant="ghost"
						onClick={handleClose}
						iconSize="lg"
						aria-label={t("common.map.closeLayerTree")}
					>
						<X className="size-6!" aria-hidden="true" focusable="false" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-2 overflow-auto tab-ring">
				<LayerTreeContent layers={subjectLayers} />
			</CardContent>
		</Card>
	);
};

// Updated LayerTreeContent component with store-based accordion control
export const LayerTreeContent: FC<{
	layers?: ManagedLayer[];
}> = ({ layers: providedLayers }) => {
	const { t } = useTranslation();
	const { subjectLayers } = useLayerData();
	const openLegendLayerId = useMapStore((state) => state.openLegendLayerId);
	const setOpenLegendLayerId = useMapStore(
		(state) => state.setOpenLegendLayerId,
	);

	const layersToRender = providedLayers || subjectLayers;

	const handleAccordionChange = useCallback(
		(value: string) => {
			setOpenLegendLayerId(value);
		},
		[setOpenLegendLayerId],
	);

	if (layersToRender.length === 0) {
		return (
			<div className="flex items-center justify-center py-8 text-foreground">
				<p>{t("common.map.noLayersAvailable")}</p>
			</div>
		);
	}

	return (
		<Accordion
			type="single"
			collapsible
			value={openLegendLayerId}
			onValueChange={handleAccordionChange}
			className="flex flex-col gap-2 overflow-y-auto"
			role="list"
			aria-label={t("common.map.availableLayers")}
		>
			{layersToRender.map((layer) => (
				<LayerItem key={layer.id} layer={layer} />
			))}
		</Accordion>
	);
};

export default LayerTree;
