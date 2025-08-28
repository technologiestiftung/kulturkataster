"use client";

import { Button } from "@/components/ui/button";
import Close from "@/icons/close.svg";
import { District } from "@/types";
import { FC } from "react";
import { useTranslation } from "react-i18next";

// Simple district filter component
interface DistrictTagsProps {
	districts: District[];
	selected: string[];
	onChange: (key: string) => void;
}

const DistrictTags: FC<DistrictTagsProps> = ({
	districts,
	selected,
	onChange,
}) => {
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<div className="flex flex-wrap gap-2 mb-4">
			{districts.map((district) => {
				const isSelected = selected.includes(district.key);
				const translatedName =
					tEnum(`berlin_district.${district.key}`) ||
					district.name ||
					district.key;

				return (
					<Button
						key={district.key}
						variant="tag"
						size="tag"
						className={isSelected ? "bg-neutral-80 text-white" : ""}
						onClick={() => onChange(district.key)}
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
