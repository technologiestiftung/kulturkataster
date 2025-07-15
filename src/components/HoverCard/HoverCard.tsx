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

// TODO: fix hovercard props naming

const HoverCard: FC<HoverCardProps> = ({ features }) => {
	const [featureProperties, setFeatureProperties] = useState<any>(null);

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
					<CardTitle>{featureProperties["Name der K"] || "Unknown"}</CardTitle>
					<CardDescription>
						{featureProperties["Unterkateg"] || "No category"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<p>
							<strong>Type:</strong> {featureProperties.Kulturortk}
						</p>
						<p>
							<strong>Address:</strong> {featureProperties.Addresse}
						</p>
						<p>
							<strong>District:</strong> {featureProperties["Bezirk (Na)"]}
						</p>
						<p>
							<strong>ZIP:</strong> {featureProperties.PLZ}
						</p>
						{featureProperties.Website && (
							<p>
								<strong>Website:</strong>
								<a
									href={featureProperties.Website}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline ml-1"
								>
									{featureProperties.Website}
								</a>
							</p>
						)}
						{featureProperties.Telefonnum && (
							<p>
								<strong>Phone:</strong> {featureProperties.Telefonnum}
							</p>
						)}
						{featureProperties["E-Mail-Adr"] && (
							<p>
								<strong>Email:</strong> {featureProperties["E-Mail-Adr"]}
							</p>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex-col items-start space-y-1">
					{featureProperties.Dachorgani && (
						<p>
							<strong>Organization:</strong> {featureProperties.Dachorgani}
						</p>
					)}
					<p>
						<strong>Data Source:</strong> {featureProperties.Datenquell}
					</p>
					<p>
						<strong>Status:</strong>{" "}
						{featureProperties["Öffnungs-"] || "Unknown"}
					</p>
				</CardFooter>
			</Card>
		</div>
	);
};

export default HoverCard;
