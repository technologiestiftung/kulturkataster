"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalFooter } from "./ModalFooter";

interface PageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: string;
	content: React.ReactNode;
}

export function PageModal({
	open,
	onOpenChange,
	title,
	subtitle,
	content,
}: PageModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant="fullScreenNoBottom"
				className="flex flex-col gap-4 items-start space-y-4"
			>
				<div className="flex flex-col space-y-4 mt-8 p-6 md:p-32">
					<span className="display">{title}</span>
					{subtitle && <h2 className="body1">{subtitle}</h2>}
					<div className="space-y-4 flex-1">
						<div className="body2">{content}</div>
					</div>
				</div>
				<ModalFooter />
			</DialogContent>
		</Dialog>
	);
}
