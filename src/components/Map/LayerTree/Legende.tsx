"use client";

import { FC } from "react";
import rawLegenden from "@/config/resources/legenden.json";
import { cn } from "@/lib/utils";
import GesamtIndexLegende from "./GesamtIndexLegende";

interface LegendeProps {
	id: string;
}

type SingleLegendItem = {
	type: "line" | "wording" | "circle" | "title" | "intro" | "table" | "spacer";
	label?: string;
	background?: string;
	text?: string;
	color?: string;
	borderColor?: string;
	textInCircle?: string;
};

type LegendItem = {
	id: string;
	wider?: string;
	items: SingleLegendItem[];
};

const Legende: FC<LegendeProps> = ({ id }) => {
	const legenden = rawLegenden as LegendItem[];
	const item: LegendItem | undefined = legenden.find(
		(legend) => legend.id === id,
	);
	if (!item) {
		return null;
	}
	return (
		<>
			{item.items.map((legendItem, index) => (
				<div
					key={index}
					className={cn(
						"flex items-center gap-3",
						legendItem.type !== "table" &&
							legendItem.type !== "spacer" &&
							"py-2.5", // px-4
					)}
				>
					<div
						className={cn(
							"flex justify-center text-center",
							item.wider || "min-w-[3.125rem]",
							(legendItem.type === "title" ||
								legendItem.type === "intro" ||
								legendItem.type === "table" ||
								legendItem.type === "spacer") &&
								"hidden",
						)}
					>
						{legendItem.type === "line" && (
							<div
								className={cn(
									"w-[3.125rem] h-[0.3125rem]",
									legendItem.background,
								)}
							/>
						)}
						{legendItem.type === "circle" && (
							<div
								className={cn(
									"w-[1.875rem] h-[1.875rem] border-2 rounded-full",
									"flex items-center justify-center",
									legendItem.background,
									legendItem.borderColor,
								)}
							>
								{legendItem.textInCircle && (
									<span className="text-sm text-[#000000]">
										{legendItem.textInCircle}
									</span>
								)}
							</div>
						)}
						{legendItem.type === "wording" && (
							<span
								className={cn(
									"font-bold text-sm tracking-wide",
									legendItem.color,
								)}
							>
								{legendItem.text}
							</span>
						)}
					</div>
					{legendItem.label && (
						<span
							className={cn(
								legendItem.type === "title" &&
									"font-bold text-base tracking-wide",
							)}
						>
							{legendItem.label}
						</span>
					)}
					{legendItem.type === "table" && <GesamtIndexLegende />}
					{legendItem.type === "spacer" && (
						<div className="bg-neutral-20 contrast:bg-neutral-80 w-full h-[1px]" />
					)}
				</div>
			))}
		</>
	);
};

export default Legende;
