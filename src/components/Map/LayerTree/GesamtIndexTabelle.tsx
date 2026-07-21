"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const columns = [
	{ key: "-", labelKey: "", index: 0 },
	{ key: "high", labelKey: "high", index: 1 },
	{ key: "medium", labelKey: "medium", index: 2 },
	{ key: "low", labelKey: "low", index: 3 },
	{ key: "veryLow", labelKey: "veryLow", index: 4 },
];

type Cell = {
	value: number | string;
	suffix: string;
	color: string;
};

const rows: {
	labelKey: string;
	subLabel: string;
	cells: Cell[];
}[] = [
	{
		labelKey: "positive",
		subLabel: "+",
		cells: [
			{ value: 3, suffix: "1+", color: "bg-[#DBF9C0]" },
			{ value: 33, suffix: "2+", color: "bg-[#BEDAFC]" },
			{ value: 15, suffix: "3+", color: "bg-[#F9DA96]" },
			{ value: 22, suffix: "4+", color: "bg-[#F7CEF0]" },
		],
	},
	{
		labelKey: "stable",
		subLabel: "+/-",
		cells: [
			{ value: 66, suffix: "1+/-", color: "bg-[#B5C994]" },
			{ value: 284, suffix: "2+/-", color: "bg-[#90BAF9]" },
			{ value: 35, suffix: "3+/-", color: "bg-[#ECAE61]" },
			{ value: 26, suffix: "4+/-", color: "bg-[#E491BD]" },
		],
	},
	{
		labelKey: "negative",
		subLabel: "-",
		cells: [
			{ value: 17, suffix: "1-", color: "bg-[#6F904F]" },
			{ value: 33, suffix: "2-", color: "bg-[#4065C5]" },
			{ value: 2, suffix: "3-", color: "bg-[#DD742C]" },
			{ value: 0, suffix: "4-", color: "bg-[#BC4072]" },
		],
	},
];

const ColumnHeader = () => {
	const { t } = useTranslation();

	return (
		<tr className="align-center">
			{columns.map((columHead) => {
				const columHeadClasses = cn(
					"border-b border-[#E2DFDB]",
					!!columHead.index && "py-1 text-center",
				);
				if (!columHead.index) {
					return (
						<th key={columHead.key} className={columHeadClasses} scope="col">
							<span className="sr-only">Column</span>
						</th>
					);
				}
				return (
					<th key={columHead.key} className={columHeadClasses} scope="col">
						<span className="font-normal text-[#000000]">
							{t(
								`common.map.legend.overallIndexTable.columns.${columHead.labelKey}`,
							)}
							<br />
							<span className="font-bold text-[#000000]">
								{columHead.index}
							</span>
						</span>
					</th>
				);
			})}
		</tr>
	);
};

const TableRows = ({ index }: { index: number }) => {
	const { t } = useTranslation();
	const findRow = rows.find((_, rowIndex) => rowIndex === index);
	if (!findRow) {
		return null;
	}
	return (
		<tr>
			<th className="py-3 text-right align-middle" scope="row">
				<div className="flex flex-col items-center leading-tight">
					<span className="text-[#000000]">
						{t(`common.map.legend.overallIndexTable.rows.${findRow.labelKey}`)}
					</span>
					<span className="font-bold text-[#000000]">{findRow.subLabel}</span>
				</div>
			</th>
			{findRow.cells.map((cell, cellIndex) => (
				<td key={cellIndex} className="py-3 text-center align-middle">
					<div className="flex items-center justify-center gap-1">
						<div
							className={cn(
								"flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#555B54] body3 text-[#000000]",
								cell.color,
							)}
						>
							{cell.value}
						</div>
						<span className="text-xs min-w-[1.375rem] font-bold text-left text-[#000000]">
							{cell.suffix}
						</span>
					</div>
				</td>
			))}
		</tr>
	);
};

export default function GesamtIndexTabelle() {
	const { t } = useTranslation();
	const descriptionId = "gesamtindex-beschreibung";
	const yAxisLabel = t("common.map.legend.overallIndexTable.yAxisLabel");
	const xAxisLabel = t("common.map.legend.overallIndexTable.xAxisLabel");
	return (
		<div className="relative">
			<div className="absolute transform rotate-[-90deg] -translate-x-[1rem] left-0 top-1/2 -translate-y-1/2">
				<span className="font-bold ">{xAxisLabel}</span>
			</div>
			<div className="ml-[1.5rem] w-full text-center mb-1.5">
				<span className="font-bold">{yAxisLabel}</span>
			</div>
			<p id={descriptionId} className="sr-only">
				{t("common.map.legend.legendGesamtIndexDecriptionSR", {
					yAxisLabel,
					xAxisLabel,
				})}
			</p>
			<div className="inline-block rounded border border-[#E2DFDB] bg-background body3 w-[calc(100%-1.5rem)] ml-[1.5rem]">
				<table
					className="border-collapse table-fixed w-full"
					aria-label={t("common.map.legend.legendGesamtIndexAriaLabel")}
					aria-describedby={descriptionId}
				>
					<thead>
						<ColumnHeader />
					</thead>
					<tbody>
						{rows.map((_, rowIndex) => (
							<TableRows key={rowIndex} index={rowIndex} />
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
