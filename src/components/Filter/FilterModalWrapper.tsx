"use client";

import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";

type FilterModalWrapperProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: ReactNode;
	description?: ReactNode;
	children: ReactNode;
};

export function FilterModalWrapper({
	open,
	onOpenChange,
	title,
	description,
	children,
}: FilterModalWrapperProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="fullscreen-muted" className="p-4">
				<div className="max-w-3xl space-y-4 w-full place-self-center">
					<DialogTitle className="sr-only">{title}</DialogTitle>
					<h2>{title}</h2>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
