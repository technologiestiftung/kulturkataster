"use client";

import FilterIcon from "@/icons/filter.svg";
import { ButtonWithTooltip } from "@/components/ui/button-with-tooltip";
import { useInstitutionStore } from "@/lib/store/institutionStore";
import { cn } from "@/lib/utils";

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
		(filters.culture_index_ranges?.length ?? 0) +
		(filters.status ? 1 : 0) +
		(filters.include_closed ? 1 : 0);

	return (
		<ButtonWithTooltip
			radius="full"
			variant="surface"
			iconSize="lg"
			tooltipSide="bottom"
			tooltip={tooltip}
			className={cn("relative overflow-visible!", className)}
			onClick={onClick}
		>
			<FilterIcon className="size-5!" />
			{showCount && activeFilterCount > 0 ? (
				<span className="absolute right-0 top-0 flex h-6 min-w-6 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-primary px-1 text-center text-primary-foreground">
					{activeFilterCount}
				</span>
			) : null}
		</ButtonWithTooltip>
	);
}
