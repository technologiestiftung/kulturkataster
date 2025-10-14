import { cn } from "@/lib/utils";

interface LoadingProps {
	className?: string;
	size?: "sm" | "md" | "lg";
	variant?: "spinner" | "dots" | "pulse";
}

function Loading({
	className,
	size = "md",
	variant = "spinner",
}: LoadingProps) {
	const sizeClasses = {
		sm: "w-6 h-6",
		md: "w-8 h-8",
		lg: "w-12 h-12",
	};

	if (variant === "spinner") {
		return (
			<div className={cn("flex items-center justify-center", className)}>
				<div
					className={cn(
						"animate-spin rounded-full border-4 border-gray-300 border-t-primary",
						sizeClasses[size],
					)}
				/>
			</div>
		);
	}

	if (variant === "dots") {
		return (
			<div
				className={cn("flex items-center justify-center space-x-1", className)}
			>
				<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
				<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
				<div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
			</div>
		);
	}

	if (variant === "pulse") {
		return (
			<div className={cn("flex items-center justify-center", className)}>
				<div
					className={cn(
						"bg-primary rounded-full animate-pulse",
						sizeClasses[size],
					)}
				/>
			</div>
		);
	}

	return null;
}

export { Loading };
