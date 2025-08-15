/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import InfoCircleIcon from "@/icons/info-circle-fill.svg";
import { getMatchingSubcategories } from "@/lib/utils/categoryUtils";
import { getCategoryIconComponent } from "@/lib/utils/iconUtils"; // Update this import path
import { Category } from "@/types";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
	const { t: tEnum } = useTranslation("enumMap");
	const { t } = useTranslation("common");

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

	return (
		<div className="HoverCard-root">
			<Card className="w-80 shadow-lg border-none">
				<CardHeader className="p-2">
					<div className="flex gap-2 justify-between">
						<CardTitle className="text-lg font-semibold line-clamp-2 w-full">
							{featureProperties.name}
						</CardTitle>
						<InfoCircleIcon />
					</div>
				</CardHeader>

				<CardContent className="p-2 pt-0">
					<div className="flex flex-col gap-2 ">
						{featureProperties.categories?.map((category: Category) => {
							const IconComponent = getCategoryIconComponent(category.key);
							const matchingSubcategories = getMatchingSubcategories(
								category,
								featureProperties.subcategories || [],
							);

							return (
								<div key={category.id}>
									<div className="flex items-center gap-2 h-6">
										<div className="w-6 h-6">
											<IconComponent />
										</div>
										<span className="text-md font-semibold">
											{tEnum(`category.${category.key}`)}
										</span>
									</div>
									{matchingSubcategories.length > 0 && (
										<div className="pl-8">
											{matchingSubcategories.map((subcategory, index) => (
												<span key={subcategory.id} className="text-sm">
													{index > 0 && ", "}
													{tEnum(`subcategory.${subcategory.key}`)}
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
					className={`rounded-b-md p-2 ${featureProperties.utilization_status === "in_use" ? "bg-brand-light" : "bg-alert"}`}
				>
					{featureProperties.utilization_status && (
						<div className=" flex gap-1 items-center justify-between">
							<span>{t("institution.utilizationStatus")}:</span>
							{/* todo: add status name */}
							<span>
								{tEnum(
									`utilization_status.${featureProperties.utilization_status}`,
								)}
							</span>
						</div>
					)}
					{!featureProperties.utilization_status && (
						<div className=" flex gap-1 items-center justify-between">
							<span className="text-md font-semibold">
								{t("institution.utilizationStatus")}:
							</span>
							<span>{t("unknown")}</span>
						</div>
					)}
				</CardFooter>
			</Card>
		</div>
	);
};

export default HoverCard;
