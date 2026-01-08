"use client";

import { Button } from "@/components/ui/button";
import Close from "@/icons/close.svg";
import { FC } from "react";
import { useTranslation } from "react-i18next";

// Simple district filter component
interface DistrictTagsProps {
	districts: string[];
	selected: string[];
	onChange: (key: string) => void;
}

const DistrictTags: FC<DistrictTagsProps> = ({
	districts,
	selected,
	onChange,
}) => {
	const { t: tEnum } = useTranslation("enumMap");
	const { t } = useTranslation("content");

	return (
		<div className="flex flex-wrap gap-2 mb-4">
			{districts.map((district) => {
				if (!district) return null;
				const isSelected = selected.includes(district);
				const translatedName = tEnum(`${district}`) || district;

				return (
					<Button
						key={district}
						variant="tag"
						size="tag"
						className={isSelected ? "bg-neutral-80 text-background" : ""}
						onClick={() => onChange(district)}
						role="switch"
						aria-checked={isSelected}
						aria-label={t("filter.districtTagsSwitchAriaLabel", {
							translatedName,
						})}
					>
						{translatedName}
						{isSelected && (
							<span className="ml-0 w-full">
								<Close size={4} viewBox="0 0 24 24" />
							</span>
						)}
					</Button>
				);
			})}
		</div>
	);
};

export default DistrictTags;
