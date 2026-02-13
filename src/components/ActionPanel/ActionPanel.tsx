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
	errorFallback?: string;
	className?: string;
	icon?: ReactNode;
};

export function ActionPanel({
	children,
	title,
	actionLabel,
	actionLabelLoading,
	onAction,
	errorFallback,
	className,
	icon,
}: ActionPanelProps) {
	const [message, setMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

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
					<p className="body2">{children}</p>
				</div>
				{onAction && (
					<Button
						type="button"
						variant="outline"
						size="md"
						disabled={isLoading}
						onClick={handleAction}
					>
						{isLoading ? actionLabelLoading : actionLabel}
					</Button>
				)}
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
