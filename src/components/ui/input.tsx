import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
	icon?: React.ReactNode;
	iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, icon, iconPosition = "left", ...props }, ref) => {
		const ariaLabel =
			props["aria-label"] ?? (props.id ? undefined : props.placeholder);
		if (icon) {
			return (
				<div className="relative">
					<div
						className={cn(
							"absolute top-1/2 transform -translate-y-1/2 pointer-events-none",
							iconPosition === "left" ? "left-5" : "right-5",
						)}
						aria-hidden="true"
					>
						{icon}
					</div>
					<input
						type={type}
						data-slot="input"
						className={cn(
							"file:text-foreground placeholder:text-neutral-60 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-14 w-full min-w-0 rounded-sm bg-transparent py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:body3 file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:body3",
							"focus-visible:border-ring focus-visible:ring-ring/100 focus-visible:ring-2 focus-visible:ring-inset",
							"aria-invalid:ring-destructive aria-invalid:ring-inset dark:aria-invalid:ring-destructive aria-invalid:border-destructive",
							iconPosition === "left" ? "pl-12 pr-3" : "pl-3 pr-12",
							className,
						)}
						ref={ref}
						aria-label={ariaLabel}
						{...props}
					/>
				</div>
			);
		}

		return (
			<input
				type={type}
				data-slot="input"
				className={cn(
					"file:text-foreground placeholder:text-neutral-60 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-14 w-full min-w-0 rounded-sm bg-transparent px-3 py-1 border-input border bg-background text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:body3 file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:body3",
					"focus-visible:border-ring focus-visible:ring-ring/100 focus-visible:ring-2 focus-visible:ring-inset",
					"aria-invalid:ring-destructive/20 aria-invalid:ring-inset dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
					className,
				)}
				ref={ref}
				aria-label={ariaLabel}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";

export { Input };
