"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import KukaLargeLogo from "@/logos/kuka-large.svg";

interface PageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: string;
	content: React.ReactNode;
	buttonText?: string;
}

export function PageModal({
	open,
	onOpenChange,
	title,
	subtitle,
	content,
	buttonText = "Close",
}: PageModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant="fullScreenNoBottom"
				className="flex flex-col gap-4 items-start  space-y-4"
			>
				<div className=" space-y-4 p-32">
					<span className="display">{title}</span>
					{subtitle && <h2 className="body1">{subtitle}</h2>}
					<div className="space-y-4 flex-1">
						<div className="body2">{content}</div>
						<div className="flex justify-end space-x-2">
							<Button onClick={() => onOpenChange(false)}>{buttonText}</Button>
						</div>
					</div>
				</div>
				<div className="flex justify-center w-full bg-background p-8">
					<div className="w-1/2">
						<KukaLargeLogo className="w-full h-auto" />
					</div>
					<div className="w-1/2 flex items-center justify-center">
						<p className="body2 text-center">
							This project is a collaboration between KUKA and Kulturkataster.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
