"use client";

import { Badge } from "@/components/ui/badge";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import ContextMapIcon from "@/icons/fachkarten.svg";
import { useAppStore } from "@/lib/store/appStore";
import { useMapStore } from "@/lib/store/mapStore";
import { ManagedLayer } from "@/types";
import Image from "next/image";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

const LayerTreeControl: FC = () => {
	const { t } = useTranslation();
	const layers = useMapStore((state) => state.layers);
	const isLayerTreeOpen = useAppStore((state) => state.isLayerTreeOpen);
	const setIsLayerTreeOpen = useAppStore((state) => state.setIsLayerTreeOpen);

	const subjectLayers = useMemo(
		() => layers.filter((l) => l.layerType === "subject"),
		[layers],
	);

	const visibleSubjectLayers = useMemo(
		() => subjectLayers.filter((l) => l.visibility),
		[subjectLayers],
	);

	const topVisibleLayer = useMemo(() => {
		return visibleSubjectLayers.reduce(
			(topLayer, currentLayer) => {
				return !topLayer || currentLayer.zIndex > topLayer.zIndex
					? currentLayer
					: topLayer;
			},
			null as ManagedLayer | null,
		);
	}, [visibleSubjectLayers]);

	const visibleCount = visibleSubjectLayers.length;

	const handleLayerTreeOpen = () => {
		setIsLayerTreeOpen(!isLayerTreeOpen);
	};

	const topVisibleLayerName =
		topVisibleLayer?.config.service.name?.trim() ||
		t("common.map.unnamedLayer", { defaultValue: "Unbenannte Fachkarte" });

	const renderThumbnail = () => {
		if (topVisibleLayer?.config.service.preview?.src) {
			return (
				<Image
					src={topVisibleLayer.config.service.preview.src}
					alt={topVisibleLayerName}
					width={64}
					height={64}
					className="w-full h-full object-cover"
				/>
			);
		}
		return (
			<div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center">
				<div className="w-6 h-6 border-2 border-purple-400 rounded-full opacity-50"></div>
			</div>
		);
	};

	return (
		<div className="relative">
			<ButtonWithTooltip
				radius="full"
				variant="surface"
				iconSize="lg"
				tooltip={t("common.map.layerTree")}
				tooltipSide="right"
				onClick={handleLayerTreeOpen}
				aria-label={t("common.map.layerTreeAriaLabel", { visibleCount })}
				aria-expanded={isLayerTreeOpen}
				className={`p-0 bg-neutral-80 overflow-hidden cursor-pointer md:hover:bg-accent hover:bg-neutral-70`}
			>
				<div className="w-full h-full flex items-center justify-center">
					{useIsMobile() ? (
						<ContextMapIcon className="[&>path]:fill-popover" />
					) : (
						<>
							{visibleCount === 0 && (
								<ContextMapIcon className="[&>path]:fill-popover" />
							)}
							{visibleCount >= 1 && renderThumbnail()}
						</>
					)}
				</div>
			</ButtonWithTooltip>

			{visibleCount > 0 && (
				<Badge
					variant="default"
					aria-hidden="true"
					className="pointer-events-none absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full text-xs font-bold"
				>
					{visibleCount}
				</Badge>
			)}
		</div>
	);
};

export default LayerTreeControl;
