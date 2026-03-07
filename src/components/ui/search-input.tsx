import * as React from "react";
import Search from "@/icons/search.svg";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = React.ComponentProps<typeof Input> & {
	rightSlot?: React.ReactNode;
	containerClassName?: string;
};

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			className,
			containerClassName,
			rightSlot,
			icon,
			iconPosition = "left",
			...props
		},
		ref,
	) => {
		return (
			<div className={cn("relative ", containerClassName)}>
				<Input
					ref={ref}
					icon={icon ?? <Search className="w-5 h-5 text-foreground" />}
					iconPosition={iconPosition}
					className={cn(
						className,
						"h-14 bg-background border-border border shadow-sm rounded-full truncate pr-16 md:pr-0",
					)}
					{...props}
				/>
				{rightSlot}
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
