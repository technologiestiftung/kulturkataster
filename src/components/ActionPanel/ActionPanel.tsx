import { useState } from "react";
import { Button } from "@/components/ui/button";

type ActionPanelProps = {
	title: string;
	description: string;
	actionLabel: string;
	actionLabelLoading: string;
	onAction: () => Promise<string | null | undefined>;
	errorFallback: string;
	className?: string;
};

export function ActionPanel({
	title,
	description,
	actionLabel,
	actionLabelLoading,
	onAction,
	errorFallback,
	className,
}: ActionPanelProps) {
	const [message, setMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleAction = async () => {
		setIsLoading(true);
		setMessage(null);
		try {
			const resultMessage = await onAction();
			setMessage(resultMessage ?? null);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : errorFallback);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={`rounded-sm border border-input bg-background p-4 ${className}`}
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold">{title}</p>
					<p className="text-xs text-muted-foreground">{description}</p>
				</div>
				<Button
					type="button"
					variant="outline"
					disabled={isLoading}
					onClick={handleAction}
				>
					{isLoading ? actionLabelLoading : actionLabel}
				</Button>
			</div>
			{message && (
				<p className="mt-2 text-xs text-muted-foreground">{message}</p>
			)}
		</div>
	);
}
