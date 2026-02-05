"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { cn } from "@/lib/utils";

type RoutedEditorModalProps = {
	children: React.ReactNode;
	routePath?: string;
	returnTo?: string;
	onClose?: () => void;
	open?: boolean;
	showBackButton?: boolean;
	contentClassName?: string;
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
}: RoutedEditorModalProps) {
	const pathname = usePathname();
	const handleClose = useRoutedModalClose({ returnTo, onClose });

	const isRouteMatch = routePath
		? Boolean(pathname && pathname.endsWith(routePath))
		: Boolean(open);

	if (!isRouteMatch) {
		return null;
	}

	return (
		<Dialog
			open={isRouteMatch}
			onOpenChange={(openState) => (!openState ? handleClose() : undefined)}
		>
			<DialogContent
				variant="editor"
				showBackButton={showBackButton}
				onBack={handleClose}
				className={cn("p-0", contentClassName)}
			>
				{children}
			</DialogContent>
		</Dialog>
	);
}
