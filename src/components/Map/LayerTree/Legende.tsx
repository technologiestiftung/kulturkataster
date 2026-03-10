/* eslint-disable complexity */
"use client";

import { FC } from "react";
import rawLegenden from "@/config/resources/legenden.json";
import rawLegendenEn from "@/config/resources/legenden.en.json";
import { cn } from "@/lib/utils";
import GesamtIndexTabelle from "./GesamtIndexTabelle";
import { useTranslation } from "react-i18next";

interface LegendeProps {
	id: string;
	serviceName: string;
}

type SingleLegendItem = {
	type: "line" | "wording" | "circle" | "title" | "intro" | "table" | "spacer";
	label?: string;
	background?: string;
	text?: string;
	color?: string;
	borderColor?: string;
	textInCircle?: string;
	unit?: string;
};

type LegendItem = {
	id: string;
	wider?: string;
	items: SingleLegendItem[];
};

const Legende: FC<LegendeProps> = ({ id, serviceName }) => {
	const { t, i18n } = useTranslation("common");
	const legenden = (
		i18n.resolvedLanguage?.startsWith("de") ? rawLegenden : rawLegendenEn
	) as LegendItem[];
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
							"py-2.5",
					)}
				>
					{/* Legend Symbol */}
					<div
						aria-hidden={legendItem.type !== "wording" ? "true" : "false"}
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
									<span className="body3 text-[#000000]">
										{legendItem.textInCircle}
									</span>
								)}
							</div>
						)}
						{legendItem.type === "wording" && (
							<span
								aria-label={t("map.legend.legendValueWordingAriaLabel", {
									serviceName,
									value: legendItem.text,
									label: legendItem.label,
								})}
								className={cn(
									"font-bold body3 tracking-wide",
									legendItem.color,
								)}
							>
								{legendItem.text}
							</span>
						)}
					</div>
					{/* Legend Labels */}
					{legendItem.label && (
						<span
							aria-label={t("map.legend.legendValueAriaLabel", {
								serviceName,
								label: legendItem.label,
								unit: legendItem.unit ?? "",
							})}
							className={cn(
								legendItem.type === "title" &&
									"font-bold text-base tracking-wide",
							)}
						>
							{legendItem.label}
						</span>
					)}
					{legendItem.type === "table" && <GesamtIndexTabelle />}
					{legendItem.type === "spacer" && (
						<div className="bg-neutral-20 contrast:bg-neutral-80 w-full h-[1px]" />
					)}
				</div>
			))}
		</>
	);
};

export default Legende;
