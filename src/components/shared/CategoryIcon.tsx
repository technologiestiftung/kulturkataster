"use client";

import MultiCategoriesIcon from "@/icons/multi-categories.svg";
import PlaceholderIcon from "@/icons/placeholder.svg";
import { CategoryKeys } from "@/types";
import { useMemo, useState } from "react";

type CategoryIconProps = {
	iconUrl?: string | null;
	categoryKey?: string | null;
	className?: string;
};

export function CategoryIcon({
	iconUrl,
	categoryKey,
	className = "h-6 w-6",
}: CategoryIconProps) {
	const [hasError, setHasError] = useState(false);

	const resolvedIconUrl = useMemo(() => {
		if (typeof iconUrl !== "string") return null;
		const trimmed = iconUrl.trim();
		return trimmed.length > 0 ? trimmed : null;
	}, [iconUrl]);

	const FallbackIcon =
		categoryKey === CategoryKeys.MULTI_CATEGORIES
			? MultiCategoriesIcon
			: PlaceholderIcon;

	if (!resolvedIconUrl || hasError) {
		return (
			<FallbackIcon
				aria-hidden="true"
				focusable="false"
				className={className}
			/>
		);
	}

	return (
		<img
			src={resolvedIconUrl}
			alt=""
			aria-hidden="true"
			className={className}
			onError={() => setHasError(true)}
		/>
	);
}
