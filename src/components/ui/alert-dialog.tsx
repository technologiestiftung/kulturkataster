"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type AlertDialogProps = {
	title: string;
	description: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
	showConfirm?: boolean;
	showCancel?: boolean;
};

function AlertDialog({
	title,
	description,
	open = true,
	onOpenChange,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onCancel,
	showConfirm = Boolean(confirmLabel && onConfirm),
	showCancel = Boolean(cancelLabel && onCancel),
}: AlertDialogProps) {
	const hasActions = showConfirm || showCancel;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant="alert" className="p-0">
				<div className="flex flex-col gap-4 p-6">
					<DialogTitle className="title">{title}</DialogTitle>
					<p className="text-foreground">{description}</p>
					{hasActions && (
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
							{showCancel && (
								<Button type="button" variant="outline" onClick={onCancel}>
									{cancelLabel}
								</Button>
							)}
							{showConfirm && (
								<Button type="button" onClick={onConfirm}>
									{confirmLabel}
								</Button>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export { AlertDialog };
