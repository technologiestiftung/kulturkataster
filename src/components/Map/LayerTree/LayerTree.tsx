"use client";

import { useMapStore } from "@/lib/store/mapStore";

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
import ContextMapIcon from "@/icons/fachkarten.svg";
import { ManagedLayer } from "@/types";
import { X } from "lucide-react";
import Image from "next/image";
import { FC, useMemo, useState } from "react";

const LayerTree: FC = () => {
	const layers = useMapStore((state) => state.layers);
	const setLayerVisibility = useMapStore((state) => state.setLayerVisibility);
	const [isOpen, setIsOpen] = useState(true);

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

	const LayerItem = ({ layer }: { layer: ManagedLayer }) => {
		return (
			<div
				className={`bg-white rounded-sm space-y-2 ${layer.visibility ? "shadow-sm" : ""}`}
			>
				<div className="flex items-center justify-between p-3 m-0">
					<div className="flex items-center space-x-3 flex-1">
						{/* Layer thumbnail/icon */}
						<div className="w-[80px] h-[80px] rounded flex-shrink-0 overflow-hidden relative">
							{layer.config.service.preview.src ? (
								<Image
									src={layer.config.service.preview.src}
									alt={layer.config.service.name}
									width={80}
									height={80}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center">
									<div className="w-6 h-6 border-2 border-purple-400 rounded opacity-50"></div>
								</div>
							)}

							{/* Pink overlay when layer is visible */}
							{layer.visibility && (
								<div className="absolute inset-0 bg-primary/30 flex items-center justify-center border-2 border-primary"></div>
							)}
						</div>

						{/* Layer info */}
						<div className="flex flex-col">
							<Label
								htmlFor={layer.id}
								className={`text-sm font-medium cursor-pointer flex ${layer.visibility ? "text-primary" : ""}`}
							>
								{layer.config.service.name}
							</Label>
							{/* Additional info */}
							<div className="text-xs">{layer.config.service.name_lang}</div>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex items-center space-x-1">
						<div className="w-11 h-11 flex items-center justify-center">
							<Checkbox
								id={layer.id}
								checked={layer.visibility}
								onCheckedChange={(checked) => {
									setLayerVisibility(layer.id, Boolean(checked));
								}}
								className="w-6 h-6 rounded-full"
							/>
						</div>
					</div>
				</div>

				{/* Legend toggle using Accordion */}
				{layer.config.service.legend &&
					typeof layer.config.service.legend === "string" && (
						<Accordion
							type="single"
							collapsible
							className="bg-neutral-20 rounded-b-sm"
						>
							<AccordionItem value="legend" className="border-none">
								<AccordionTrigger className="px-3 py-2 hover:no-underline flex justify-end items-center gap-2 [&>svg]:text-black">
									Legende ansehen
								</AccordionTrigger>
								<AccordionContent className="px-3 pb-3 rounded-b-sm">
									<Image
										src={layer.config.service.legend}
										alt="legend"
										width={300}
										height={200}
									/>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					)}
			</div>
		);
	};

	if (!isOpen) {
		const visibleCount = visibleSubjectLayers.length;

		const renderThumbnail = () => {
			if (topVisibleLayer?.config.service.preview.src) {
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
					<div className="w-6 h-6 border-2 border-purple-400 rounded opacity-50"></div>
				</div>
			);
		};

		return (
			<div className="fixed bottom-4 left-4 z-50">
				<div className="relative">
					{/* Stacked layers effect for multiple visible layers */}
					{visibleCount > 1 && (
						<>
							<div className="absolute -top-1 left-1 w-16 h-16 bg-primary/30 border-2 rounded border-primary"></div>
						</>
					)}

					<div
						className={`relative w-16 h-16 p-0 bg-neutral-80 shadow-lg rounded flex items-center justify-center cursor-pointer ${visibleCount > 0 ? "border-2 border-primary" : ""}`}
						onClick={() => setIsOpen(true)}
					>
						<div className="w-full h-full overflow-hidden rounded flex items-center justify-center">
							{visibleCount === 0 && (
								<ContextMapIcon className="[&>path]:fill-white" />
							)}
							{visibleCount === 1 && renderThumbnail()}
							{visibleCount > 1 && renderThumbnail()}
						</div>
					</div>

					{visibleCount > 1 && (
						<Badge
							variant="default"
							className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full border-2 border-white text-xs font-bold"
						>
							{visibleCount}
						</Badge>
					)}
				</div>
			</div>
		);
	}

	return (
		<Card className="w-[400px] max-h-[70vh] absolute bottom-4 left-4 z-50 flex flex-col bg-neutral-5">
			<CardHeader className="shadow-sm p-1 pl-6">
				<div className="flex items-center justify-between">
					<CardTitle className="body1">Fachkarten</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="w-14 h-14 p-0"
						onClick={() => setIsOpen(false)}
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
			</CardHeader>

			<CardContent className="p-2 flex flex-col gap-2 overflow-y-auto">
				{subjectLayers.map((layer) => (
					<LayerItem key={layer.id} layer={layer} />
				))}
			</CardContent>
		</Card>
	);
};

export default LayerTree;
