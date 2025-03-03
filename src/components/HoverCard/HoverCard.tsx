import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { HoverCardData } from "@/types";
import { FC, useEffect, useState } from "react";

interface HoverCardProps {
	data: HoverCardData;
}

const HoverCard: FC<HoverCardProps> = ({ data }) => {
	const [windowSize, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});
	const [position, setPosition] = useState<{
		top: number;
		left: number;
		transform: string;
	}>({
		top: data.y,
		left: data.x,
		transform: "translate(-50%, -110%)",
	});

	const CARD_WIDTH = 320;
	const CARD_HEIGHT = 240;
	const BUFFER = 20;

	useEffect(() => {
		const calculatePosition = () => {
			const viewportWidth = windowSize.width;
			const viewportHeight = windowSize.height;

			const spaceAbove = data.y;
			const spaceBelow = viewportHeight - data.y;
			const spaceLeft = data.x;
			const spaceRight = viewportWidth - data.x;

			let newTop = data.y;
			let newLeft = data.x;
			let newTransform = "";

			if (spaceAbove > CARD_HEIGHT + BUFFER) {
				newTransform += "translateY(-100%)";
				newTop -= BUFFER;
			} else if (spaceBelow > CARD_HEIGHT + BUFFER) {
				newTop += BUFFER;
			} else {
				newTop = Math.max(
					BUFFER,
					Math.min(
						viewportHeight - CARD_HEIGHT - BUFFER,
						data.y - CARD_HEIGHT / 2,
					),
				);
			}

			if (
				spaceRight > CARD_WIDTH / 2 + BUFFER &&
				spaceLeft > CARD_WIDTH / 2 + BUFFER
			) {
				newTransform += " translateX(-50%)";
			} else if (spaceRight < CARD_WIDTH + BUFFER) {
				newLeft = Math.max(BUFFER, viewportWidth - CARD_WIDTH - BUFFER);
			} else if (spaceLeft < CARD_WIDTH + BUFFER) {
				newLeft = BUFFER + CARD_WIDTH / 2;
			}

			return {
				top: newTop,
				left: newLeft,
				transform: newTransform,
			};
		};

		setPosition(calculatePosition());
	}, [windowSize, data]);

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<div
			className="HoverCard-root absolute z-10 w-64"
			style={{
				top: position.top,
				left: position.left,
				transform: position.transform,
			}}
		>
			<Card>
				<CardHeader>
					<CardTitle>{data.venue_name}</CardTitle>
					<CardDescription>Card Description</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Card Content</p>
				</CardContent>
				<CardFooter>
					<p>Card Footer</p>
				</CardFooter>
			</Card>
		</div>
	);
};

export default HoverCard;
