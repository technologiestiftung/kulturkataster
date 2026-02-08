"use client";

import { cn } from "@/lib/utils";
import { PrivateBadge } from "./PrivateBadge";

interface InfoItemProps {
	label?: string;
	description?: string;
	children: React.ReactNode;
	alwaysShow?: boolean;
	action?: React.ReactNode;
	className?: string;
	isPrivate?: boolean;
}

export function InfoItem({
	label,
	description,
	children,
	alwaysShow = false,
	action,
	className,
	isPrivate = false,
}: InfoItemProps) {
	if (!alwaysShow && (!children || children === "")) {
		return null;
	}

	return (
		<div className={cn(className, "InfoItem flex justify-between items-start")}>
			<div className="flex flex-wrap gap-1">
				{label && (
					<div className="flex items-start justify-between gap-3">
						<p className="body2">
							<strong>{label}:</strong>
						</p>
						<div className="flex items-center gap-2">{action}</div>
					</div>
				)}
				{description && <p className="body2 text-neutral-80">{description}</p>}
				<p className="body2">{children}</p>
			</div>
			<div>{isPrivate ? <PrivateBadge /> : null}</div>
		</div>
	);
}
