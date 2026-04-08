"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Close from "@/icons/close.svg";
import BackIcon from "@/icons/chevron-left.svg";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useRestoreFocus } from "@/hooks/use-restore-focus";
import KukaSmallLogo from "@/logos/kuka-small.svg";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { Button } from "./button";

type DialogRootProps = React.ComponentProps<typeof DialogPrimitive.Root>;
type DialogProps = DialogRootProps;

function Dialog({ open, onOpenChange, ...props }: DialogProps) {
	useRestoreFocus(open);

	return (
		<DialogPrimitive.Root
			data-slot="dialog"
			open={open}
			onOpenChange={(newOpen) => {
				onOpenChange?.(newOpen);
			}}
			{...props}
		/>
	);
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
				"motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
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
	variant = "standard",
	showBackButton = false,
	showLogo = true,
	onBack,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
	showBackButton?: boolean;
	onBack?: () => void;
	showLogo?: boolean;
	variant?:
		| "standard"
		| "fullscreen-inset"
		| "fullscreen"
		| "fullscreen-muted"
		| "centered"
		| "mobile-menu"
		| "multi-select"
		| "alert"
		| "editor";
}) {
	const { t } = useTranslation("common");
	const focusRef = React.useRef<HTMLDivElement | null>(null);
	const toLocalePath = useLocalePath();
	const getVariantStyles = () => {
		const variants = {
			standard:
				"fixed top-[50%] left-[50%] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] md:rounded-lg border p-6 sm:max-w-3xl max-h-full overflow-auto",
			"fullscreen-inset": "fixed z-[70] inset-0 m-[8rem]",
			fullscreen:
				"fixed z-[70] top-0 md:top-[5rem] left-1/2 w-full max-w-314 h-full md:h-[calc(100%-5rem)] -translate-x-1/2 md:rounded-t-lg border",
			"fullscreen-muted":
				"fixed z-[70]  top-0 md:top-[5rem] left-1/2 w-full max-w-314 h-full md:h-[calc(100%-5rem)] -translate-x-1/2 md:rounded-t-lg border",
			centered:
				"fixed z-[70] top-0 md:top-1/2 left-1/2 w-full max-w-314 h-full md:h-auto md:max-h-[calc(100%-5rem)] -translate-x-1/2 md:-translate-y-1/2 md:rounded-lg border flex flex-col",
			"mobile-menu": "fixed z-[70] h-full inset-0 w-full border-0 p-0",
			editor:
				"fixed z-[70] top-0 md:top-[5rem] left-1/2 w-full max-w-314 h-full md:h-[calc(100%-5rem)] -translate-x-1/2 md:rounded-t-lg border",
			"multi-select":
				"bg-neutral-5 fixed z-[75] top-0 md:top-1/2 left-1/2 w-full max-w-[calc(100%-2rem)] h-full md:h-auto md:max-h-[calc(100%-5rem)] -translate-x-1/2 md:-translate-y-1/2 md:rounded-lg border md:max-w-5xl flex flex-col overflow-hidden",
			alert:
				"fixed z-[70] top-1/2 left-1/2 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 md:max-w-lg md:rounded-lg border bg-secondary",
		} as const;

		return variants[variant];
	};

	const backAndCloseClassNames = (type: "back" | "close") => {
		return cn(
			"fixed top-4 md:top-6 z-[80]",
			type === "back" ? "left-4 md:left-6" : "right-4 md:right-6",
			"",
		);
	};

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay
				className={
					variant === "multi-select"
						? "z-[71]"
						: variant === "alert"
							? "bg-black/40 z-[70]"
							: ""
				}
			/>
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					"bg-secondary md:bg-background motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:zoom-out-95 motion-safe:data-[state=open]:zoom-in-95 z-[61] shadow-lg duration-200 relative",
					getVariantStyles(),
					variant === "fullscreen-muted" && "bg-neutral-10 md:bg-neutral-10",
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
				{!showBackButton && showLogo && (
					<div className="absolute top-6 left-4 md:hidden block z-99">
						<a href={toLocalePath("/welcome")} aria-label={t("kukaLogo")}>
							<KukaSmallLogo
								title="Kulturkataster Berlin, Logo"
								className="size-14 cursor-pointer hover:opacity-80 transition-opacity"
							/>
						</a>
					</div>
				)}
				{showBackButton && (
					<Button
						variant="icon"
						iconSize="lg"
						radius="full"
						onClick={onBack}
						className={backAndCloseClassNames("back")}
					>
						<BackIcon />
						<span className="sr-only">{t("back")}</span>
					</Button>
				)}
				{showCloseButton && (
					<DialogPrimitive.Close
						asChild
						data-slot="dialog-close"
						className="absolute"
					>
						<Button
							variant="icon"
							iconSize="lg"
							radius="full"
							className={backAndCloseClassNames("close")}
						>
							<Close />
							<span className="sr-only">{t("close")}</span>
						</Button>
					</DialogPrimitive.Close>
				)}
				{(() => {
					if (variant === "mobile-menu") {
						return children;
					}
					if (variant === "editor") {
						return (
							<div className="flex flex-col h-full w-full overflow-auto md:mt-0 mt-20">
								{children}
							</div>
						);
					}
					return (
						<div className="Modal-Root overflow-auto h-full w-full tab-ring">
							{children}
						</div>
					);
				})()}
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
			className={cn("text-foreground body3", className)}
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
