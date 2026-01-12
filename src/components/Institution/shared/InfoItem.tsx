"use client";

interface InfoItemProps {
	label: string;
	children: React.ReactNode;
	alwaysShow?: boolean;
}

export function InfoItem({
	label,
	children,
	alwaysShow = false,
}: InfoItemProps) {
	// Hide if no content and alwaysShow is false
	if (!alwaysShow && (!children || children === "")) {
		return null;
	}

	return (
		<div>
			<p className="body2">
				<strong className="font-bold">{label}:</strong>
			</p>
			<p className="body2">{children}</p>
		</div>
	);
}
