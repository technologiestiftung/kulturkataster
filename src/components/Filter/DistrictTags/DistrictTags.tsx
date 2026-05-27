"use client";

import { Badge } from "@/components/ui/badge";
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
	const { t: tEnum } = useTranslation();
	const { t } = useTranslation();

	return (
		<div className="flex flex-wrap gap-2 mb-4">
			{districts.map((district) => {
				if (!district) return null;
				const isSelected = selected.includes(district);
				const translatedName = tEnum(`enumMap.${district}`) || district;

				return (
					<Badge
						key={district}
						variant="tag"
						data-selected={isSelected}
						onClick={() => onChange(district)}
						role="switch"
						aria-checked={isSelected}
						aria-label={t("content.filter.districtTagsSwitchAriaLabel", {
							translatedName,
						})}
					>
						{translatedName}
						{isSelected && <Close className="ml-2 h-3 w-3" />}
					</Badge>
				);
			})}
		</div>
	);
};

export default DistrictTags;
