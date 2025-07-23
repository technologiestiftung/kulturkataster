/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FC, useEffect, useState } from "react";

interface HoverCardProps {
	features?: any;
}

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

		const properties = features.getProperties();
		setFeatureProperties(properties.features[0].values_);
	}, [features]);

	if (!features || !featureProperties) {
		return null;
	}

	return (
		<div className="HoverCard-root">
			<Card>
				<CardHeader>
					<CardTitle>{featureProperties.name}</CardTitle>
					<CardDescription>
						{featureProperties.categories.forEach((category: any) => {
							return (
								<span key={category} className="mr-2">
									{category}
								</span>
							);
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2"></div>
				</CardContent>
				<CardFooter className="flex-col items-start space-y-1">
					{featureProperties.utilization_status && (
						<p>
							<strong>Status:</strong>
							{featureProperties.utilization_status}
						</p>
					)}
				</CardFooter>
			</Card>
		</div>
	);
};

export default HoverCard;
