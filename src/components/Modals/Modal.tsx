"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModalFooter } from "./ModalFooter";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useRoutedModalClose } from "./useRoutedModalClose";
import { showErrorToast } from "@/lib/utils/feedbackToast";
import { AppLoading } from "@/components/ui/app-loading";
import { useRouter } from "next/navigation";
import { devTimings } from "@/lib/utils/devTimings";

type ModalCloseConfirmation = {
	title: string;
	description: string;
	status?: "info" | "warning" | "error" | "success";
	confirmLabel?: string;
	cancelLabel?: string;
};

type ModalConfirmDialog = {
	open: boolean;
	status?: "info" | "warning" | "error" | "success";
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void | Promise<void>;
	onCancel?: () => void;
	onOpenChange?: (open: boolean) => void;
};

type ModalErrorDialog = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	onConfirm: () => void;
	onOpenChange?: (open: boolean) => void;
};

type ModalAutoCloseError = {
	active: boolean;
	title: string;
	description: string;
};

type ModalLoadingState = {
	active: boolean;
	label?: string;
};

interface PageModalProps {
	title: string;
	beforeTitle?: React.ReactNode;
	subtitle?: React.ReactNode;
	variant?: "fullscreen" | "fullscreen-muted" | "centered" | "editor";
	hasFooter?: boolean;
	open?: boolean;
	routePath?: string;
	returnTo?: string;
	backTo?: string;
	children?: React.ReactNode;
	showBackButton?: boolean;
	hideLinksInModalFooter?: string[];
	containerClassName?: string;
	contentWrapperClassName?: string;
	contentClassName?: string;
	titleClassName?: string;
	subtitleClassName?: string;
	closeOnOutsideInteract?: boolean;
	closeConfirmation?: ModalCloseConfirmation | false;
	confirmDialog?: ModalConfirmDialog;
	errorDialog?: ModalErrorDialog;
	autoCloseError?: ModalAutoCloseError;
	loadingState?: ModalLoadingState;
	onCloseRequest?: () => void;
}

export function Modal({
	title,
	beforeTitle,
	subtitle,
	variant = "fullscreen",
	hasFooter = true,
	open = true,
	routePath,
	returnTo,
	backTo,
	children,
	showBackButton,
	hideLinksInModalFooter,
	containerClassName,
	contentWrapperClassName,
	contentClassName,
	titleClassName,
	subtitleClassName,
	closeOnOutsideInteract = false,
	closeConfirmation,
	confirmDialog,
	errorDialog,
	autoCloseError,
	loadingState,
	onCloseRequest,
}: PageModalProps) {
	const pathname = usePathname();
	const router = useRouter();
	const performClose = useRoutedModalClose({ returnTo });
	const hasLoggedOpenTiming = useRef(false);
	useEffect(() => {
		if (!hasLoggedOpenTiming.current) {
			hasLoggedOpenTiming.current = true;
			devTimings.end();
		}
	}, []);
	const resolvedPerformClose = useCallback(() => {
		if (onCloseRequest) {
			onCloseRequest();
			return;
		}
		performClose();
	}, [onCloseRequest, performClose]);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
	const [hasHandledAutoCloseError, setHasHandledAutoCloseError] =
		useState(false);
	const resolvedCloseConfirmation =
		closeConfirmation === false ? undefined : closeConfirmation;
	const normalizePath = (value: string) =>
		value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;

	useEffect(() => {
		const scrollToHashTarget = () => {
			const hash = window.location.hash;
			if (!hash || hash === "#") return;
			const targetId = decodeURIComponent(hash.slice(1));
			const element =
				document.getElementById(targetId) ??
				document.querySelector<HTMLElement>(`[id="${CSS.escape(targetId)}"]`);
			if (element) {
				element.scrollIntoView({ behavior: "instant" });
			}
		};
		const timer = window.setTimeout(scrollToHashTarget, 500);
		return () => window.clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!autoCloseError?.active) {
			setHasHandledAutoCloseError(false);
			return;
		}
		if (hasHandledAutoCloseError) return;
		setHasHandledAutoCloseError(true);
		showErrorToast(autoCloseError.title, autoCloseError.description);
		resolvedPerformClose();
	}, [
		autoCloseError?.active,
		autoCloseError?.description,
		autoCloseError?.title,
		hasHandledAutoCloseError,
		resolvedPerformClose,
	]);

	const handleCloseRequest = useCallback(() => {
		if (resolvedCloseConfirmation) {
			setShowCloseConfirmation(true);
			return;
		}
		resolvedPerformClose();
	}, [resolvedCloseConfirmation, resolvedPerformClose]);

	const isEditorVariant = variant === "editor";
	const isRouteMatch = routePath
		? Boolean(
				pathname && normalizePath(pathname).endsWith(normalizePath(routePath)),
			)
		: Boolean(open);

	// Remember the trigger before the dialog moves focus into itself
	// (layout effects run before Radix's focus scope effect).
	useLayoutEffect(() => {
		if (!isRouteMatch) return;
		const activeElement = document.activeElement;
		returnFocusRef.current =
			activeElement instanceof HTMLElement && activeElement !== document.body
				? activeElement
				: null;
	}, [isRouteMatch]);

	const handleCloseAutoFocus = useCallback((event: Event) => {
		event.preventDefault();
		// Another dialog (e.g. the next routed modal) owns focus now.
		if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
			return;
		}
		const trigger = returnFocusRef.current;
		returnFocusRef.current = null;
		if (trigger?.isConnected) {
			trigger.focus();
			return;
		}
		document.getElementById("main-content")?.focus({ preventScroll: true });
	}, []);
	const resolvedContentClassName = contentClassName ?? "body2";
	const dialogContentClassName = isEditorVariant
		? cn("p-0", contentClassName)
		: "flex flex-col gap-4 items-start space-y-4";
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
				className={dialogContentClassName}
				showBackButton={showBackButton}
				onBack={
					backTo && showBackButton
						? () => router.replace(backTo)
						: handleCloseRequest
				}
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
				onCloseAutoFocus={handleCloseAutoFocus}
			>
				{isEditorVariant ? (
					<>
						{title ? (
							<DialogTitle className="sr-only">{title}</DialogTitle>
						) : null}
						{loadingState?.active ? (
							<div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 p-6 md:mt-0 mt-20">
								<AppLoading />
							</div>
						) : (
							children
						)}
					</>
				) : (
					<div
						className={cn(
							"flex flex-col w-full flex-1 space-y-4 mt-20 md:mt-8 p-4 md:p-6 mx-auto max-w-4xl",
							containerClassName,
						)}
					>
						{beforeTitle}
						{title && (
							<DialogTitle asChild className={cn(titleClassName)}>
								<h1>{title}</h1>
							</DialogTitle>
						)}
						{subtitle && (
							<p className={cn("body1", subtitleClassName)}>{subtitle}</p>
						)}
						<div className={cn("space-y-4 flex-1", contentWrapperClassName)}>
							<div className={resolvedContentClassName}>
								{loadingState?.active ? (
									<div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3">
										<AppLoading />
										{loadingState.label ? (
											<p className="body2 text-foreground">
												{loadingState.label}
											</p>
										) : null}
									</div>
								) : (
									children
								)}
							</div>
						</div>
					</div>
				)}
				{!isEditorVariant && hasFooter && (
					<ModalFooter hideLinks={hideLinksInModalFooter} />
				)}
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
						resolvedPerformClose();
					}}
					onOpenChange={(openState) => {
						if (!openState) setShowCloseConfirmation(false);
					}}
				/>
			) : null}
			{confirmDialog?.open ? (
				<AlertDialog
					open
					status={confirmDialog.status ?? "warning"}
					title={confirmDialog.title}
					description={confirmDialog.description}
					confirmLabel={confirmDialog.confirmLabel}
					cancelLabel={confirmDialog.cancelLabel ?? "Abbrechen"}
					onCancel={confirmDialog.onCancel}
					onConfirm={confirmDialog.onConfirm}
					onOpenChange={confirmDialog.onOpenChange}
				/>
			) : null}
			{errorDialog?.open ? (
				<AlertDialog
					open
					status="error"
					title={errorDialog.title}
					description={errorDialog.description}
					confirmLabel={errorDialog.confirmLabel}
					onConfirm={errorDialog.onConfirm}
					onOpenChange={errorDialog.onOpenChange}
				/>
			) : null}
		</Dialog>
	);
}
