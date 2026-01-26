import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

type ActionPanelProps = {
	title: string;
	description: string;
	actionLabel: string;
	actionLabelLoading: string;
	onAction: () => Promise<string | null | undefined>;
	errorFallback: string;
	className?: string;
	icon?: ReactNode;
};

export function ActionPanel({
	title,
	description,
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
			className={cn(
				"rounded-sm border border-input bg-background p-4",
				className,
			)}
		>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						{icon && <span className="text-muted-foreground">{icon}</span>}
						<Label className="font-bold">
							<strong>{title}</strong>
						</Label>
					</div>
					<p className="body2">{description}</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					disabled={isLoading}
					onClick={handleAction}
				>
					{isLoading ? actionLabelLoading : actionLabel}
				</Button>
			</div>
			{message && <p className="mt-2 text-xs text-foreground">{message}</p>}
		</div>
	);
}
