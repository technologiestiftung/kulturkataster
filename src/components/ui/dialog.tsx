"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Close from "@/icons/close.svg";
import BackIcon from "@/icons/chevron-left.svg";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useRestoreFocus } from "@/hooks/use-restore-focus";
import { useModalStore } from "@/lib/store/modalStore";

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
	hideBackIcon = false,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
	hideBackIcon?: boolean;
	variant?:
		| "default"
		| "fullScreen"
		| "fullScreenNoBottom"
		| "fullScreenNoBottomDarkerBackground"
		| "medium"
		| "mobileMenu";
}) {
	const { t } = useTranslation("common");
	const focusRef = React.useRef<HTMLDivElement | null>(null);

	const { modalHistory, backOnModal } = useModalStore();

	const getVariantStyles = () => {
		switch (variant) {
			case "fullScreen":
				return "fixed z-[70] inset-0 m-[8rem]";
			case "fullScreenNoBottom":
			case "fullScreenNoBottomDarkerBackground":
				return "fixed z-[70] top-0 md:top-[5rem] left-1/2 w-full max-w-314 h-full md:h-[calc(100%-5rem)] -translate-x-1/2 md:rounded-t-lg border";
			case "medium":
				return "fixed z-[70] top-0 md:top-1/2 left-1/2 w-full max-w-314 h-full md:h-auto md:max-h-[calc(100%-5rem)] -translate-x-1/2 md:-translate-y-1/2 md:rounded-lg border flex flex-col";
			case "mobileMenu":
				return "fixed z-[70] h-full inset-0 w-full border-0 p-0";
			case "default":
			default:
				return "fixed top-[50%] left-[50%] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] md:rounded-lg border p-6 sm:max-w-3xl";
		}
	};

	const backAndCloseClassNames = (type: "back" | "close") => {
		return cn(
			"ring-offset-background focus:ring-ring fixed top-12 z-[80] rounded-xs transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
			type === "back" ? "left-6 md:left-12" : "right-6 md:right-12",
			"opacity-100 md:opacity-70 bg-white contrast:bg-background md:bg-transparent",
		);
	};

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 shadow-lg duration-200 relative",
					getVariantStyles(),
					variant === "fullScreenNoBottomDarkerBackground" && "bg-neutral-10",
					className,
				)}
				aria-describedby={undefined}
				ref={focusRef}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					focusRef.current?.focus();
					setTimeout(() => focusRef.current?.blur(), 100);
				}}
				{...props}
			>
				{!hideBackIcon && modalHistory.length > 1 && (
					<button
						onClick={backOnModal}
						className={backAndCloseClassNames("back")}
					>
						<BackIcon className="size-6" />
						<span className="sr-only">{t("back")}</span>
					</button>
				)}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className={backAndCloseClassNames("close")}
					>
						<Close className="size-6" />
						<span className="sr-only">{t("close")}</span>
					</DialogPrimitive.Close>
				)}
				{variant === "mobileMenu" ? (
					children
				) : (
					<div className="overflow-auto h-full w-full tab-ring">{children}</div>
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
};
