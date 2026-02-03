"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type RoutedEditorModalProps = {
	children: React.ReactNode;
	routePath?: string;
	closeTo?: string;
	onClose?: () => void;
	open?: boolean;
	showBackButton?: boolean;
	contentClassName?: string;
};

type UseRoutedModalCloseArgs = {
	closeTo?: string;
	onClose?: () => void;
};

export function useRoutedModalClose({
	closeTo,
	onClose,
}: UseRoutedModalCloseArgs) {
	const router = useRouter();

	return useCallback(() => {
		if (onClose) {
			onClose();
			return;
		}

		if (closeTo) {
			router.replace(closeTo);
			return;
		}

		const canGoBack =
			typeof window !== "undefined" &&
			window.history.state?.idx !== undefined &&
			window.history.state.idx > 0;

		if (canGoBack) {
			router.back();
		} else {
			router.push("/");
		}
	}, [closeTo, onClose, router]);
}

export function RoutedEditorModal({
	children,
	routePath,
	closeTo,
	onClose,
	open = true,
	showBackButton = false,
	contentClassName,
}: RoutedEditorModalProps) {
	const pathname = usePathname();
	const handleClose = useRoutedModalClose({ closeTo, onClose });

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
