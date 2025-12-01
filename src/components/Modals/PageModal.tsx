"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModalFooter } from "./ModalFooter";

interface PageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: React.ReactNode;
	variant?:
		| "fullScreenNoBottom"
		| "fullScreenNoBottomDarkerBackground"
		| "medium";
	hasFooter?: boolean;
	content: React.ReactNode;
	hideBackIcon?: boolean;
	hideLinksInModalFooter?: string[];
}

export function PageModal({
	open,
	onOpenChange,
	title,
	subtitle,
	variant = "fullScreenNoBottom",
	hasFooter = true,
	content,
	hideBackIcon,
	hideLinksInModalFooter,
}: PageModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant={variant}
				className="flex flex-col gap-4 items-start space-y-4"
				hideBackIcon={hideBackIcon}
			>
				<div className="flex flex-col w-full space-y-4 mt-8 p-6 md:p-32">
					<DialogTitle className="display">{title}</DialogTitle>
					{subtitle && <h2 className="body1">{subtitle}</h2>}
					<div className="space-y-4 flex-1">
						<div className="body2">{content}</div>
					</div>
				</div>
				{hasFooter && <ModalFooter hideLinks={hideLinksInModalFooter} />}
			</DialogContent>
		</Dialog>
	);
}
