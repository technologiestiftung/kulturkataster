"use client";

import { Children } from "react";

interface InfoSectionProps {
	children: React.ReactNode;
}

export function InfoSection({ children }: InfoSectionProps) {
	const validChildren = Children.toArray(children).filter(Boolean);

	if (validChildren.length === 0) {
		return null;
	}

	return (
		<div className="rounded space-y-4 p-4 bg-neutral-5">{validChildren}</div>
	);
}
