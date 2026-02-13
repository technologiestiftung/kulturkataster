"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

type RoutedEditorModalProps = {
	children: React.ReactNode;
	routePath?: string;
	returnTo?: string;
	onClose?: () => void;
	open?: boolean;
	showBackButton?: boolean;
	contentClassName?: string;
	closeConfirmation?: ModalCloseConfirmation | false;
};

type UseRoutedModalCloseArgs = {
	returnTo?: string;
	onClose?: () => void;
};

export function useRoutedModalClose({
	returnTo,
	onClose,
}: UseRoutedModalCloseArgs) {
	const router = useRouter();
	const toLocalePath = useLocalePath();

	return useCallback(() => {
		if (onClose) {
			onClose();
			return;
		}

		if (returnTo) {
			router.replace(toLocalePath(returnTo));
			return;
		}

		const canGoBack =
			typeof window !== "undefined" &&
			window.history.state?.idx !== undefined &&
			window.history.state.idx > 0;

		if (canGoBack) {
			router.back();
		} else {
			router.push(toLocalePath("/"));
		}
	}, [returnTo, onClose, router, toLocalePath]);
}

export function RoutedEditorModal({
	children,
	routePath,
	returnTo,
	onClose,
	open = true,
	showBackButton = false,
	contentClassName,
	closeConfirmation,
}: RoutedEditorModalProps) {
	const pathname = usePathname();
	const handleClose = useRoutedModalClose({ returnTo, onClose });
	const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
	const resolvedCloseConfirmation =
		closeConfirmation === false ? undefined : closeConfirmation;
	const normalizePath = (value: string) =>
		value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
	const handleCloseRequest = useCallback(() => {
		if (resolvedCloseConfirmation) {
			setShowCloseConfirmation(true);
			return;
		}
		handleClose();
	}, [resolvedCloseConfirmation, handleClose]);

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
				variant="editor"
				showBackButton={showBackButton}
				onBack={handleCloseRequest}
				className={cn("p-0", contentClassName)}
			>
				{children}
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
						handleClose();
					}}
					onOpenChange={(openState) => {
						if (!openState) setShowCloseConfirmation(false);
					}}
				/>
			) : null}
		</Dialog>
	);
}
