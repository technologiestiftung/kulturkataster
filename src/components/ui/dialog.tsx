"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import Close from "@/icons/close.svg";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useRestoreFocus } from "@/hooks/use-restore-focus";

type DialogRootProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Dialog({ open, ...props }: DialogRootProps) {
	useRestoreFocus(open);

	return <DialogPrimitive.Root data-slot="dialog" open={open} {...props} />;
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
				className,
			)}
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	variant = "default",
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
	variant?:
		| "default"
		| "fullScreen"
		| "fullScreenNoBottom"
		| "medium"
		| "mobileMenu";
}) {
	const { t } = useTranslation("common");

	const getVariantStyles = () => {
		switch (variant) {
			case "fullScreen":
				return "fixed z-[70] inset-0 m-[8rem]";
			case "fullScreenNoBottom":
				return "fixed z-[70] top-0 md:top-[5rem] left-1/2 w-full max-w-314 h-full md:h-[calc(100%-5rem)] -translate-x-1/2 overflow-auto md:rounded-t-lg border";
			case "medium":
				return "fixed z-[70] top-0 md:top-1/2 left-1/2 w-full max-w-314 h-full md:h-auto md:max-h-[calc(100%-5rem)] -translate-x-1/2 md:-translate-y-1/2 md:rounded-lg border flex flex-col";
			case "mobileMenu":
				return "fixed z-[70] h-full inset-0 w-full border-0 p-0";
			case "default":
			default:
				return "fixed top-[50%] left-[50%] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] md:rounded-lg border p-6 sm:max-w-lg";
		}
	};

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 shadow-lg duration-200 relative",
					getVariantStyles(),
					className,
				)}
				aria-describedby={undefined}
				{...props}
			>
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground fixed top-12 right-12 z-[80] rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6"
					>
						<Close className="size-6" />
						<span className="sr-only">{t("close")}</span>
					</DialogPrimitive.Close>
				)}
				{variant === "mobileMenu" ? (
					children
				) : (
					<div className="overflow-auto h-full w-full">{children}</div>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
			{...props}
		/>
	);
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			{...props}
		/>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("", className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function InterceptedDialogContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
	const router = useRouter();

	const onDismiss = React.useCallback(() => {
		router.back();
	}, [router]);

	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				onEscapeKeyDown={onDismiss}
				onPointerDownOutside={onDismiss}
				className={cn(
					"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200",
					className,
				)}
				aria-describedby={undefined}
				{...props}
			>
				{children}
				<button
					onClick={onDismiss}
					className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
				>
					<Close className="h-6 w-6" />
					<span className="sr-only">Close</span>
				</button>
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
	InterceptedDialogContent,
};
