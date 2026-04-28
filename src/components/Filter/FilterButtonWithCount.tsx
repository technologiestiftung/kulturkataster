"use client";

import FilterIcon from "@/icons/filter.svg";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { useInstitutionStore } from "@/lib/store/institutionStore";

type FilterButtonWithCountProps = {
	onClick?: () => void;
	tooltip: string;
	className?: string;
	showCount?: boolean;
	size?: "default" | "action";
};

export function FilterButtonWithCount({
	onClick,
	tooltip,
	className,
	showCount = true,
}: FilterButtonWithCountProps) {
	const filters = useInstitutionStore((state) => state.filters);
	const activeFilterCount =
		(filters.district_keys?.length ?? 0) +
		(filters.category_keys?.length ?? 0) +
		(filters.child_category_keys?.length ?? 0) +
		(filters.status ? 1 : 0) +
		(filters.include_closed ? 1 : 0);

	return (
		<ButtonWithTooltip
			radius="full"
			variant="surface"
			iconSize="lg"
			tooltipSide="bottom"
			tooltip={tooltip}
			className={className}
			onClick={onClick}
		>
			<div className="relative">
				<FilterIcon className="size-5!" />
				{showCount && activeFilterCount > 0 ? (
					<span className="absolute -top-5 left-4.5 min-w-6 h-6 rounded-full bg-primary text-primary-foreground text-center px-1">
						{activeFilterCount}
					</span>
				) : null}
			</div>
		</ButtonWithTooltip>
	);
}
