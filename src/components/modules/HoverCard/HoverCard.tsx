import { FC } from "react";

interface HoverCardProps {
	data: HoverCardData;
}

export interface HoverCardData {
	x: number;
	y: number;
	description: string;
	name: string;
}

const HoverCard: FC<HoverCardProps> = ({ data }) => {
	return (
		<div
			className="HoverCard-root absolute z-10 w-64 bg-white h-auto p-2 rounded"
			style={{
				top: data.y,
				left: data.x,
				transform: "translate(-50%, -110%)",
			}}
		>
			<h1 className="text-lg bold">{data.name}</h1>
			<p>{data.description}</p>
		</div>
	);
};

export default HoverCard;
