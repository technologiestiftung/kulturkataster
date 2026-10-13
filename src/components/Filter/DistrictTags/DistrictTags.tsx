"use client";

import { Badge } from "@/components/ui/badge";
import Close from "@/icons/close.svg";
import { FC } from "react";

// Simple district filter component
interface DistrictTagsProps {
	districts: string[];
	selected: string[];
	onChange: (key: string) => void;
	/** Id of the heading that names this group of toggle buttons. */
	labelledBy?: string;
}

const DistrictTags: FC<DistrictTagsProps> = ({
	districts,
	selected,
	onChange,
	labelledBy,
}) => {
	return (
		<div
			className="flex flex-wrap gap-2 mb-4"
			role="group"
			aria-labelledby={labelledBy}
		>
			{districts.map((district) => {
				if (!district) return null;
				const isSelected = selected.includes(district);

				return (
					<Badge
						key={district}
						variant="tag"
						data-selected={isSelected}
						asChild
					>
						<button
							type="button"
							aria-pressed={isSelected}
							onClick={() => onChange(district)}
						>
							{district}
							{isSelected && (
								<Close className="ml-2 h-3 w-3" aria-hidden="true" />
							)}
						</button>
					</Badge>
				);
			})}
		</div>
	);
};

export default DistrictTags;
