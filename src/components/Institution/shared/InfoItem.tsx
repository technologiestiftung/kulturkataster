"use client";

interface InfoItemProps {
	label?: string;
	description?: string;
	children: React.ReactNode;
	alwaysShow?: boolean;
	action?: React.ReactNode;
	className?: string;
}

export function InfoItem({
	label,
	description,
	children,
	alwaysShow = false,
	action,
	className,
}: InfoItemProps) {
	// Hide if no content and alwaysShow is false
	if (!alwaysShow && (!children || children === "")) {
		return null;
	}

	return (
		<div className={className}>
			{label && (
				<div className="flex items-start justify-between gap-3">
					<p className="body2">
						<strong>{label}:</strong>
					</p>
					{action}
				</div>
			)}
			{description && <p className="body2 text-neutral-80">{description}</p>}
			<p className="body2">{children}</p>
		</div>
	);
}
