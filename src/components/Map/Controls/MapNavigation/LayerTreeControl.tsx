"use client";

import { Badge } from "@/components/ui/badge";
import { ButtonWithTooltip } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import ContextMapIcon from "@/icons/fachkarten.svg";
import { useMapStore } from "@/lib/store/mapStore";
import { ManagedLayer } from "@/types";
import Image from "next/image";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

const LayerTreeControl: FC = () => {
	const { t } = useTranslation("common");
	const layers = useMapStore((state) => state.layers);
	const setIsLayerTreeOpen = useMapStore((state) => state.setIsLayerTreeOpen);
	const { setOpen, setOpenMobile, isMobile } = useSidebar();

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
		setIsLayerTreeOpen(true);
		if (isMobile) {
			setOpenMobile(true);
		} else {
			setOpen(true);
		}
	};

	const renderThumbnail = () => {
		if (topVisibleLayer?.config.service.preview?.src) {
			return (
				<Image
					src={topVisibleLayer.config.service.preview.src}
					alt={topVisibleLayer.config.service.name}
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
				variant="map-icon"
				size="icon-only"
				tooltip={t("map.layerTree")}
				onClick={handleLayerTreeOpen}
				className={`relative w-12 h-12 p-0 bg-neutral-80 overflow-hidden cursor-pointer`}
			>
				<div className="w-full h-full flex items-center justify-center">
					{isMobile ? (
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
					className="pointer-events-none absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full text-xs font-bold"
				>
					{visibleCount}
				</Badge>
			)}
		</div>
	);
};

export default LayerTreeControl;
