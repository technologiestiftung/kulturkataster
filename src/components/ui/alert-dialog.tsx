"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ActionPanel } from "../ActionPanel";
import InfoCircle from "@/icons/info-circle.svg";
import { useTranslation } from "react-i18next";

type AlertDialogProps = {
	title: string;
	status: "info" | "warning" | "error" | "success";
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
	status,
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
	const { t } = useTranslation("common");
	const statusKey = `alert.${status}`;
	const statusTitle = t(statusKey);
	const resolvedTitle = statusTitle === statusKey ? title : statusTitle;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				variant="alert"
				className="p-0"
				showCloseButton={false}
				showLogo={false}
			>
				<div className="flex flex-col gap-4 p-10 bg-secondary">
					<DialogTitle className="body1 font-bold">{resolvedTitle}</DialogTitle>
					<ActionPanel
						title={title}
						icon={<InfoCircle className="size-5" />}
						actionLabel={confirmLabel || ""}
						actionLabelLoading={confirmLabel || ""}
					>
						{description}
					</ActionPanel>
					{hasActions && (
						<div className="flex flex-col flex-col-reverse gap-3 md:flex-row md:justify-end">
							{showCancel && (
								<Button type="button" variant="outline" onClick={onCancel}>
									{cancelLabel}
								</Button>
							)}
							{showConfirm && (
								<Button
									type="button"
									onClick={onConfirm}
									autoFocus
									className={
										status === "warning"
											? "bg-destructive hover:bg-destructive/90"
											: ""
									}
								>
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
