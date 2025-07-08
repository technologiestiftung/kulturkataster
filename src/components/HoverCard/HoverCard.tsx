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
import { FC } from "react";

interface HoverCardProps {
	properties?: any;
}

const HoverCard: FC<HoverCardProps> = ({ properties }) => {
	return (
		<div className="HoverCard-root">
			<Card>
				<CardHeader>
					<CardTitle>{properties && properties["Name der K"]}</CardTitle>
					<CardDescription>
						{properties && properties["Name der K"]}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>{properties && properties.Kulturortk}</p>
				</CardContent>
				<CardFooter>
					<div>
						<p>{properties && properties.Dachorgani}</p>
					</div>
					<div>
						<p>{properties && properties.Datenquell}</p>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};

export default HoverCard;
