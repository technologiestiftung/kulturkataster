"use client";

interface InfoItemProps {
	label: string;
	children: React.ReactNode;
}

export function InfoItem({ label, children }: InfoItemProps) {
	return (
		<div>
			<p className="body2">
				<strong className="font-bold">{label}:</strong>
			</p>
			<p className="body2">{children}</p>
		</div>
	);
}
