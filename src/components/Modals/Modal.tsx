"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModalFooter } from "./ModalFooter";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";

type ModalCloseConfirmation = {
	title: string;
	description: string;
	status?: "info" | "warning" | "error" | "success";
	confirmLabel?: string;
	cancelLabel?: string;
};

interface PageModalProps {
	title: string;
	subtitle?: React.ReactNode;
	variant?: "fullscreen" | "fullscreen-muted" | "centered";
	hasFooter?: boolean;
	open?: boolean;
	routePath?: string;
	returnTo?: string;
	content: React.ReactNode;
	showBackButton?: boolean;
	hideLinksInModalFooter?: string[];
	containerClassName?: string;
	contentWrapperClassName?: string;
	contentClassName?: string;
	titleClassName?: string;
	subtitleClassName?: string;
	closeOnOutsideInteract?: boolean;
	closeConfirmation?: ModalCloseConfirmation | false;
}

export function Modal({
	title,
	subtitle,
	variant = "fullscreen",
	hasFooter = true,
	open = true,
	routePath,
	returnTo,
	content,
	showBackButton,
	hideLinksInModalFooter,
	containerClassName,
	contentWrapperClassName,
	contentClassName,
	titleClassName,
	subtitleClassName,
	closeOnOutsideInteract = false,
	closeConfirmation,
}: PageModalProps) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const pathname = usePathname();
	const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
	const resolvedCloseConfirmation =
		closeConfirmation === false ? undefined : closeConfirmation;
	const normalizePath = (value: string) =>
		value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
	useEffect(() => {
		const checkForHashAndScroll = () => {
			const hash = window.location.hash;
			if (hash === "#infosAndServices") {
				const element = document.getElementById("infosAndServices");
				if (element) {
					element.scrollIntoView({ behavior: "instant" });
				}
			}
		};
		setTimeout(() => {
			checkForHashAndScroll();
		}, 500);
	}, []);

	const performClose = useCallback(() => {
		if (returnTo) {
			router.replace(toLocalePath(returnTo));
			return;
		}

		// Check if we can go back in Next.js navigation history
		// Next.js tracks navigation state in window.history.state.idx
		const canGoBack =
			typeof window !== "undefined" &&
			window.history.state?.idx !== undefined &&
			window.history.state.idx > 0;

		if (canGoBack) {
			// We have navigation history within the app, go back
			router.back();
		} else {
			// No history (direct visit to modal URL), navigate to home
			router.push(toLocalePath("/"));
		}
	}, [returnTo, router, toLocalePath]);

	const handleCloseRequest = useCallback(() => {
		if (resolvedCloseConfirmation) {
			setShowCloseConfirmation(true);
			return;
		}
		performClose();
	}, [resolvedCloseConfirmation, performClose]);

	const resolvedContentClassName = contentClassName ?? "body2";
	const isRouteMatch = routePath
		? Boolean(
				pathname &&
					normalizePath(pathname).endsWith(normalizePath(routePath)),
			)
		: Boolean(open);
	if (!isRouteMatch) {
		return null;
	}

	return (
		<Dialog
			open={isRouteMatch}
			onOpenChange={(openState) =>
				!openState ? handleCloseRequest() : undefined
			}
		>
			<DialogContent
				variant={variant}
				className="flex flex-col gap-4 items-start space-y-4"
				showBackButton={showBackButton}
				onBack={handleCloseRequest}
				onInteractOutside={(event) => {
					if (!closeOnOutsideInteract) {
						event.preventDefault();
					}
				}}
				onPointerDownOutside={(event) => {
					if (!closeOnOutsideInteract) {
						event.preventDefault();
					}
				}}
				onFocusOutside={(event) => {
					if (!closeOnOutsideInteract) {
						event.preventDefault();
					}
				}}
			>
				<div
					className={cn(
						"flex flex-col w-full flex-1 space-y-4 mt-16 md:mt-8 p-6 md:p-24",
						containerClassName,
					)}
				>
					{title && (
						<DialogTitle className={cn("display", titleClassName)}>
							{title}
						</DialogTitle>
					)}
					{subtitle && (
						<h2 className={cn("body1", subtitleClassName)}>{subtitle}</h2>
					)}
					<div className={cn("space-y-4 flex-1", contentWrapperClassName)}>
						<div className={resolvedContentClassName}>{content}</div>
					</div>
				</div>
				{hasFooter && <ModalFooter hideLinks={hideLinksInModalFooter} />}
			</DialogContent>
			{showCloseConfirmation && resolvedCloseConfirmation ? (
				<AlertDialog
					open
					status={resolvedCloseConfirmation.status ?? "warning"}
					title={resolvedCloseConfirmation.title}
					description={resolvedCloseConfirmation.description}
					confirmLabel={resolvedCloseConfirmation.confirmLabel ?? "Schließen"}
					cancelLabel={resolvedCloseConfirmation.cancelLabel ?? "Abbrechen"}
					onCancel={() => setShowCloseConfirmation(false)}
					onConfirm={() => {
						setShowCloseConfirmation(false);
						performClose();
					}}
					onOpenChange={(openState) => {
						if (!openState) setShowCloseConfirmation(false);
					}}
				/>
			) : null}
		</Dialog>
	);
}
