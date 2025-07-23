/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CategoryType, getCategoryIconComponent } from "@/lib/utils/iconUtils"; // Update this import path
import { FC, useEffect, useState } from "react";

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

	const getStatusStyling = (status: string) => {
		const lowerStatus = status.toLowerCase();
		if (lowerStatus.includes("nutzung") || lowerStatus.includes("in use")) {
			return "bg-green-100 text-green-800 border-green-200";
		} else if (
			lowerStatus.includes("geschlossen") ||
			lowerStatus.includes("closed")
		) {
			return "bg-red-100 text-red-800 border-red-200";
		}
		return "bg-gray-100 text-gray-800 border-gray-200";
	};

	return (
		<div className="HoverCard-root">
			<Card className="w-80 shadow-lg">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg font-semibold line-clamp-2">
						{featureProperties.name}
					</CardTitle>
					<CardDescription>
						<div className="flex flex-col gap-2 mt-2">
							{featureProperties.categories?.map((category: Category) => {
								const IconComponent = getCategoryIconComponent(category.key);

								return (
									<div
										key={category.id}
										className="flex items-center gap-2 px-2 py-1"
									>
										<IconComponent className="w-5 h-5" />
										<span>{category.key}</span>
									</div>
								);
							})}
						</div>
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-0">
					{featureProperties.description && (
						<p className="line-clamp-3">{featureProperties.description}</p>
					)}

					{featureProperties.address && (
						<div className="mt-2">
							<p>📍 {featureProperties.address}</p>
						</div>
					)}
				</CardContent>

				<CardContent className="pt-0">
					{featureProperties.utilization_status && (
						<div className="flex items-center justify-between">
							<span>Nutzungsstatus:</span>
							<span
								className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyling(featureProperties.utilization_status)}`}
							>
								{featureProperties.utilization_status}
							</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default HoverCard;
