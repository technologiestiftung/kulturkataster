/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Category, ChildCategory } from "@/types";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFieldOptionLabel } from "@/lib/i18n/fieldLabels";
import { useFieldLabel } from "@/lib/hooks/useFieldLabel";
import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { getStatusAccentClass } from "@/components/InfoWrapper/statusTone";
import {
	getCultureIndexRangeBgClass,
	getCultureIndexRangeForValue,
} from "@/lib/constants/cultureIndexRanges";
import { cn } from "@/lib/utils";

interface HoverCardProps {
	features?: any;
}

const getFeatureData = (feature: any) => {
	const properties = feature.getProperties();

	if (properties.features && properties.features.length > 0) {
		return properties.features[0].values_;
	}

	return properties;
};

// TODO: add fonts
// TODO: add names categories and status

const HoverCard: FC<HoverCardProps> = ({ features }) => {
	const [featureProperties, setFeatureProperties] = useState<any>(null);
	const { t: tEnum } = useTranslation();
	const { t } = useTranslation();
	const fieldLabel = useFieldLabel();

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

	const cultureIndexValue: number | null =
		typeof featureProperties.culture_index === "number"
			? featureProperties.culture_index
			: null;
	const cultureIndexRange = getCultureIndexRangeForValue(cultureIndexValue);

	return (
		<div className="HoverCard-root">
			<Card className="w-80 shadow-lg border-none ">
				<CardHeader className="p-2">
					<div className="flex gap-2 justify-between">
						<CardTitle className="body1">{featureProperties.name}</CardTitle>
					</div>
				</CardHeader>

				<CardContent className="p-2 pt-0" variant="none">
					<div className="flex flex-col gap-2 ">
						{featureProperties.categories?.map((category: Category) => {
							return (
								<div key={category.id}>
									<div className="flex items-center gap-2 h-6">
										<div className="w-6 h-6">
											<CategoryIcon
												iconUrl={category.icon}
												categoryKey={category.key}
												className="w-6 h-6"
											/>
										</div>
										<span className="text-base font-bold">
											{tEnum(`enumMap.category.${category.key}`)}
										</span>
									</div>
									{featureProperties.subcategories?.length > 0 && (
										<div className="pl-8">
											{featureProperties.subcategories
												.filter(
													(subcategory: ChildCategory) =>
														subcategory.parent_category_id === category.id,
												)
												.map((subcategory: ChildCategory, index: number) => (
													<span key={subcategory.id} className="text-base">
														{index > 0 && ", "}
														{tEnum(`enumMap.category.${subcategory.key}`)}
													</span>
												))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</CardContent>

				<CardFooter
					className={cn(
						"p-2",
						!cultureIndexRange && "rounded-b-md",
						getStatusAccentClass(featureProperties.utilization_status),
					)}
				>
					{featureProperties.utilization_status && (
						<div className=" flex gap-1 items-center justify-between">
							<span className="text-base font-bold">
								{fieldLabel("utilization_status")}:
							</span>
							<span className="text-base">
								{getFieldOptionLabel(
									tEnum,
									"utilization_status",
									featureProperties.utilization_status,
								)}
							</span>
						</div>
					)}
					{!featureProperties.utilization_status && (
						<div className=" flex gap-1 items-center justify-between">
							<span className="text-base font-bold">
								{fieldLabel("utilization_status")}:
							</span>
							<span className="text-base">{t("common.unknown")}</span>
						</div>
					)}
				</CardFooter>
				{cultureIndexRange && (
					<CardFooter
						className={cn(
							"rounded-b-md p-2",
							getCultureIndexRangeBgClass(cultureIndexRange),
						)}
					>
						<div className="flex gap-1 items-center justify-between">
							<span className="text-base font-bold">
								{fieldLabel("culture_index")}:
							</span>
							<span className="text-base">
								{cultureIndexValue} -{" "}
								{t(`content.filter.cultureIndex.ranges.${cultureIndexRange}`)}
							</span>
						</div>
					</CardFooter>
				)}
			</Card>
		</div>
	);
};

export default HoverCard;
