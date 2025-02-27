import { HoverCardData } from "@/types";
import { FC } from "react";

interface HoverCardProps {
	data: HoverCardData;
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
			<h1 className="text-lg bold">{data.venue_name}</h1>
		</div>
	);
};

export default HoverCard;
