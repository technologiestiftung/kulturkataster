"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeItem = {
	id: string | number;
	label: string;
};

type Badges = {
	items: BadgeItem[];
	emptyLabel?: string;
	previewCount?: number;
	badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
	className?: string;
	badgeClassName?: string;
	emptyClassName?: string;
};

function Badges({
	items,
	emptyLabel,
	previewCount = 3,
	badgeVariant = "secondary",
	className,
	badgeClassName,
	emptyClassName,
}: Badges) {
	const { t } = useTranslation();

	const { previewItems, overflowCount } = useMemo(() => {
		const preview = items.slice(0, previewCount);
		const remaining = items.length - preview.length;
		return {
			previewItems: preview,
			overflowCount: remaining > 0 ? remaining : 0,
		};
	}, [items, previewCount]);

	if (items.length === 0) {
		return emptyLabel ? (
			<span className={cn("text-foreground", emptyClassName)}>
				{emptyLabel}
			</span>
		) : null;
	}

	return (
		<div className={cn("flex flex-wrap gap-1", className)}>
			{previewItems.map((item) => (
				<Badge
					key={item.id}
					variant={badgeVariant}
					className={cn("text-xs", badgeClassName)}
				>
					{item.label}
				</Badge>
			))}
			{overflowCount > 0 && (
				<Badge variant={badgeVariant} className={cn("text-xs", badgeClassName)}>
					{t("common.badges.more", { count: overflowCount })}
				</Badge>
			)}
		</div>
	);
}

export { Badges as BadgeOverflowList };
