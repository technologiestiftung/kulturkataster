/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMapStore } from "@/lib/store/mapStore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { FC, useState } from "react";

const LayerTree: FC = () => {
	const layers = useMapStore((state) => state.layers);
	const setLayerVisibility = useMapStore((state) => state.setLayerVisibility);
	const [isOpen, setIsOpen] = useState(true);

	const subjectLayers = layers.filter((l) => l.layerType === "subject");

	console.log("[LayerTree] subjectLayers::", subjectLayers);

	const LayerItem = ({ layer }: { layer: any }) => {
		const [showLegend, setShowLegend] = useState(false);

		return (
			<div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3 flex-1">
						{/* Layer thumbnail/icon */}
						<div className="w-12 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
							{layer.config.service.preview.src ? (
								<Image
									src={layer.config.service.preview.src}
									alt={layer.config.service.name}
									width={48}
									height={48}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center">
									<div className="w-6 h-6 border-2 border-purple-400 rounded opacity-50"></div>
								</div>
							)}
						</div>

						{/* Layer info */}

						<div className="flex flex-col">
							<Label
								htmlFor={layer.id}
								className="text-sm font-medium cursor-pointer flex"
							>
								{layer.config.service.name}
							</Label>
							{/* Additional info */}
							<div className="text-xs text-gray-500">
								{layer.config.service.name_lang}
							</div>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex items-center space-x-1">
						<Checkbox
							id={layer.id}
							checked={layer.visibility}
							onCheckedChange={(checked) => {
								setLayerVisibility(layer.id, Boolean(checked));
							}}
							className="w-4 h-4"
						/>
					</div>
				</div>

				{/* Legend toggle */}
				<div>
					<Button
						variant="ghost"
						size="sm"
						className="text-xs w-full h-6 px-2 text-gray-600 hover:text-gray-800"
						onClick={() => setShowLegend(!showLegend)}
					>
						Legende ansehen
						<ChevronDown
							className={`w-3 h-3 ml-1 transition-transform ${showLegend ? "rotate-180" : ""}`}
						/>
					</Button>
				</div>

				{/* Legend content */}
				{showLegend && layer.config.service.legend && (
					<div className="">
						<Image
							src={layer.config.service.legend}
							alt="legend"
							width={300}
							height={200}
						/>
					</div>
				)}
			</div>
		);
	};

	if (!isOpen) {
		return (
			<Button
				variant="outline"
				size="sm"
				className="fixed bottom-4 left-4 z-50 bg-white shadow-lg"
				onClick={() => setIsOpen(true)}
			>
				Fachkarten
			</Button>
		);
	}

	return (
		<Card className="w-80 max-h-[70vh] absolute bottom-4 left-4 z-50 flex flex-col">
			<CardHeader className="pb-2 flex-shrink-0">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-medium">Fachkarten</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="w-8 h-8 p-0"
						onClick={() => setIsOpen(false)}
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
			</CardHeader>

			<CardContent className="flex flex-col gap-2 overflow-y-auto flex-1">
				{subjectLayers.map((layer) => (
					<LayerItem key={layer.id} layer={layer} />
				))}
			</CardContent>
		</Card>
	);
};

export default LayerTree;
