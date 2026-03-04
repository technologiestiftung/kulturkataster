import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { AlertDialog } from "../ui/alert-dialog";

type ActionPanelProps = {
	children: ReactNode;
	title: string;
	actionLabel: string;
	actionLabelLoading: string;
	onAction?: () => Promise<string | null | undefined>;
	secondaryActionLabel?: string;
	secondaryActionLabelLoading?: string;
	onSecondaryAction?: () => Promise<string | null | undefined>;
	errorFallback?: string;
	secondaryErrorFallback?: string;
	className?: string;
	icon?: ReactNode;
};

export function ActionPanel({
	children,
	title,
	actionLabel,
	actionLabelLoading,
	onAction,
	secondaryActionLabel,
	secondaryActionLabelLoading,
	onSecondaryAction,
	errorFallback,
	secondaryErrorFallback,
	className,
	icon,
}: ActionPanelProps) {
	const [message, setMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);

	const handleAction = async () => {
		if (!onAction) return;

		setIsLoading(true);
		setMessage(null);
		try {
			const resultMessage = await onAction();
			setMessage(resultMessage ?? null);
		} catch (error) {
			if (!errorFallback) throw error;
			setMessage(error instanceof Error ? error.message : errorFallback);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSecondaryAction = async () => {
		if (!onSecondaryAction) return;

		setIsSecondaryLoading(true);
		setMessage(null);
		try {
			const resultMessage = await onSecondaryAction();
			setMessage(resultMessage ?? null);
		} catch (error) {
			if (!secondaryErrorFallback && !errorFallback) throw error;
			setMessage(
				error instanceof Error
					? error.message
					: (secondaryErrorFallback ?? errorFallback ?? ""),
			);
		} finally {
			setIsSecondaryLoading(false);
		}
	};

	return (
		<div
			className={cn(
				"rounded-sm border border-border bg-background p-4",
				className,
			)}
		>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						{icon && <span className="text-primary-dark">{icon}</span>}
						{title && <Label className="body2">{title}</Label>}
					</div>
					<div className="body2">{children}</div>
				</div>
				<div className="flex flex-wrap gap-2">
					{onSecondaryAction && secondaryActionLabel && (
						<Button
							type="button"
							variant="outline"
							disabled={isLoading || isSecondaryLoading}
							onClick={handleSecondaryAction}
						>
							{isSecondaryLoading
								? (secondaryActionLabelLoading ?? actionLabelLoading)
								: secondaryActionLabel}
						</Button>
					)}	{onAction && (
						<Button
							type="button"
							disabled={isLoading || isSecondaryLoading}
							onClick={handleAction}
						>
							{isLoading ? actionLabelLoading : actionLabel}
						</Button>
					)}
				</div>
			</div>
			<AlertDialog
				open={!!message}
				onOpenChange={(open) => {
					if (!open) setMessage(null);
				}}
				title={title}
				description={message ?? ""}
				status="success"
				confirmLabel="OK"
				onConfirm={() => setMessage(null)}
			/>
		</div>
	);
}
