"use client";

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
	CULTURE_INDEX_RANGES,
	CultureIndexRangeKey,
	getCultureIndexRangeBgClass,
} from "@/lib/constants/cultureIndexRanges";

interface CultureIndexTagsProps {
	selected: CultureIndexRangeKey[];
	onChange: (key: CultureIndexRangeKey) => void;
	counts?: Record<CultureIndexRangeKey, number>;
	/** Id of the heading that names this group of checkboxes. */
	labelledBy?: string;
}

const CultureIndexTags: FC<CultureIndexTagsProps> = ({
	selected,
	onChange,
	counts,
	labelledBy,
}) => {
	const { t } = useTranslation();

	return (
		<div
			className="flex flex-col mb-4"
			role="group"
			aria-labelledby={labelledBy}
		>
			{CULTURE_INDEX_RANGES.map((range) => {
				const isSelected = selected.includes(range.key);
				const label = t(`content.filter.cultureIndex.ranges.${range.key}`);
				const count = counts?.[range.key] ?? 0;

				return (
					<div key={range.key}>
						<div className="bg-neutral-20 contrast:bg-neutral-80 w-full h-px" />
						<div className="flex items-center gap-2 justify-between w-full py-2">
							<div className="flex items-center gap-2 body2">
								<span
									className={cn(
										"flex items-center justify-center rounded-full w-20 h-6 shrink-0 font-bold text-[#000000]",
										getCultureIndexRangeBgClass(range.key),
									)}
									aria-hidden="true"
								>
									{range.min} - {range.max}
								</span>
								<span>
									<span className="font-bold">{label}</span>
									<span className="pl-2">({count})</span>
								</span>
							</div>

							<div className="relative w-10 h-10 md:w-6 md:h-6 flex items-center justify-center shrink-0">
								<Checkbox
									checked={isSelected}
									onCheckedChange={() => onChange(range.key)}
									aria-label={t(
										"content.filter.cultureIndexTagsSwitchAriaLabel",
										{ translatedName: label },
									)}
									variant="filter"
									size="filter"
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default CultureIndexTags;
