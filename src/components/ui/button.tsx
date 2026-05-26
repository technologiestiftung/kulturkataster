import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 md:whitespace-nowrap rounded-sm button ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input text-primary-dark bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				tertiary:
					"text-primary-dark underline-offset-4 hover:underline p-0 m-0 font-normal",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
				surface: "shadow-sm bg-background hover:bg-accent border-border border",
				icon: "bg-background",
				action:
					"border-border border-2 rounded-sm border-neutral-20 shadow-xs border flex-col bg-background hover:bg-neutral-30 flex justify-center items-center text-primary-dark",
				subaction:
					"border-border border-2 rounded-sm border-neutral-20 shadow-xs border flex-col bg-neutral-5 hover:bg-neutral-30 flex justify-center items-center",
				accordion: "gap-2 justify-start text-primary-dark px-4",
				tag: "bg-neutral-10 font-light flex items-center justify-center px-4 rounded-full",
			},
			size: {
				default: "px-4.5 md:px-7 py-4",
				sm: "h-9 px-3",
				md: "h-14 md:h-12 px-6",
				lg: "h-14 px-8",
				tile: "h-32 w-40 px-10 flex-none [&_svg]:size-6",
				inline: "h-6",
			},
			iconSize: {
				sm: "h-10 w-10 flex-none [&_svg]:size-4",
				md: "h-14 w-14 md:h-12 md:w-12 flex-none [&_svg]:size-6 md:[&_svg]:size-5",
				lg: "h-14 w-14 flex-none [&_svg]:size-6",
			},
			radius: {
				sm: "rounded-sm",
				md: "rounded-md",
				full: "rounded-full",
			},
			fullWidth: {
				true: "w-full md:flex-1 md:min-w-0",
				false: "",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
			radius: "sm",
			fullWidth: true,
		},
	},
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	asChild?: boolean;
	children?: React.ReactNode;
	variant?: ButtonVariants["variant"];
	radius?: ButtonVariants["radius"];
	fullWidth?: ButtonVariants["fullWidth"];
};

type ButtonWithSize = {
	size?: ButtonVariants["size"];
	iconSize?: never;
};

type ButtonWithIconSize = {
	size?: never;
	iconSize: NonNullable<ButtonVariants["iconSize"]>;
};

export type ButtonProps = ButtonBaseProps &
	(ButtonWithSize | ButtonWithIconSize);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			iconSize,
			radius,
			fullWidth,
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";

		return (
			<Comp
				className={cn(
					buttonVariants({
						variant,
						size: iconSize ? null : size,
						iconSize,
						radius,
						fullWidth: iconSize ? false : fullWidth,
					}),
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
