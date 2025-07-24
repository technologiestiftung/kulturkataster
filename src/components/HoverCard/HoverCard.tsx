/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CategoryType, getCategoryIconComponent } from "@/lib/utils/iconUtils"; // Update this import path
import { FC, useEffect, useState } from "react";
import { Badge } from "../ui/badge";

interface HoverCardProps {
	features?: any;
}

interface Category {
	id: number;
	key: CategoryType;
}

const getFeatureData = (feature: any) => {
	const properties = feature.getProperties();

	if (properties.features && properties.features.length > 0) {
		return properties.features[0].values_;
	}

	return properties;
};

const HoverCard: FC<HoverCardProps> = ({ features }) => {
	const [featureProperties, setFeatureProperties] = useState<any>(null);

	useEffect(() => {
		console.log("[HoverCard] featureProperties::", featureProperties);
	}, [featureProperties]);

	useEffect(() => {
		if (!features) {
			setFeatureProperties(null);
			return;
		}

		setFeatureProperties(getFeatureData(features));
	}, [features]);

	if (!features || !featureProperties) {
		return null;
	}

	return (
		<div className="HoverCard-root">
			<Card className="w-80 shadow-lg border-none">
				<CardHeader className="p-2">
					<div className="flex gap-2 justify-between">
						<CardTitle className="text-lg font-semibold line-clamp-2 w-full">
							{featureProperties.name}
						</CardTitle>

						<Badge
							variant="default"
							className="w-6 h-6 p-0 rounded-full text-xs font-bold"
						>
							i
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-2 pt-0">
					<div className="flex flex-col gap-2 ">
						{featureProperties.categories?.map((category: Category) => {
							const IconComponent = getCategoryIconComponent(category.key);

							return (
								<div key={category.id}>
									<div className="flex items-center gap-2 h-6">
										<div className="w-6 h-6">
											<IconComponent />
										</div>
										<span className="text-md font-semibold">
											{/* add category name */}
											{category.key}
										</span>
									</div>
									<span className="pl-8">Subtitle</span>
								</div>
							);
						})}
					</div>
				</CardContent>

				<CardFooter
					className={`rounded-b-md p-2 ${featureProperties.utilization_status === "in_use" ? "bg-brand-light" : "bg-alert"}`}
				>
					{featureProperties.utilization_status && (
						<div className=" flex gap-1 items-center justify-between">
							<span>Nutzungsstatus:</span>
							{/* todo: add status name */}
							<span>{featureProperties.utilization_status}</span>
						</div>
					)}
					{!featureProperties.utilization_status && (
						<div className=" flex gap-1 items-center justify-between">
							<span className="text-md font-semibold">Nutzungsstatus:</span>
							<span>unbekannt</span>
						</div>
					)}
				</CardFooter>
			</Card>
		</div>
	);
};

export default HoverCard;
