"use client";

import { useMapStore } from "@/lib/store/mapStore";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FC } from "react";

const LayerTree: FC = () => {
	const layers = useMapStore((state) => state.layers);
	const setLayerVisibility = useMapStore((state) => state.setLayerVisibility);

	const baseLayers = layers.filter((l) => l.layerType === "base");
	const subjectLayers = layers.filter((l) => l.layerType === "subject");

	const handleBaseLayerChange = (layerId: string, checked: boolean) => {
		if (checked) {
			baseLayers.forEach((l) => {
				setLayerVisibility(l.id, l.id === layerId);
			});
		} else {
			const visibleBaseLayers = baseLayers.filter((l) => l.visibility).length;
			if (visibleBaseLayers > 1 || baseLayers.length === 1) {
				setLayerVisibility(layerId, false);
			}
		}
	};

	return (
		<Card className="w-80 shadow-lg absolute top-0 left-0 bottom-0 z-50">
			<div>Close</div>
			<CardHeader>
				<CardTitle className="text-lg font-medium">Karten-Ebenen</CardTitle>
			</CardHeader>
			<CardContent>
				<Accordion
					type="multiple"
					defaultValue={["subject-layers", "base-layers"]}
					className="w-full"
				>
					<AccordionItem value="subject-layers">
						<AccordionTrigger className="text-base">
							Themenebenen
						</AccordionTrigger>
						<AccordionContent className="pt-2 space-y-3">
							{subjectLayers.length > 0 ? (
								subjectLayers.map((layer) => (
									<div key={layer.id} className="flex items-center space-x-2">
										<Checkbox
											id={layer.id}
											checked={layer.visibility}
											onCheckedChange={(checked) => {
												setLayerVisibility(layer.id, Boolean(checked));
											}}
										/>
										<Label
											htmlFor={layer.id}
											className="text-sm font-normal cursor-pointer"
										>
											{layer.config.service.name}
										</Label>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground">
									Keine Themenebenen verfügbar.
								</p>
							)}
						</AccordionContent>
					</AccordionItem>

					{/* Hintergrundkarten (Base Layers) */}
					<AccordionItem value="base-layers">
						<AccordionTrigger className="text-base">
							Hintergrundkarten
						</AccordionTrigger>
						<AccordionContent className="pt-2 space-y-3">
							{baseLayers.length > 0 ? (
								baseLayers.map((layer) => (
									<div key={layer.id} className="flex items-center space-x-2">
										<Checkbox
											id={`base-${layer.id}`} // Eindeutige ID, um Konflikte zu vermeiden
											checked={layer.visibility}
											onCheckedChange={(checked) => {
												handleBaseLayerChange(layer.id, Boolean(checked));
											}}
										/>
										<Label
											htmlFor={`base-${layer.id}`}
											className="text-sm font-normal cursor-pointer"
										>
											{layer.config.service.name}
										</Label>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground">
									Keine Hintergrundkarten verfügbar.
								</p>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</CardContent>
		</Card>
	);
};

export default LayerTree;
