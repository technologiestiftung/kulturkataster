"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModalFooter } from "./ModalFooter";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageModalProps {
	title: string;
	subtitle?: React.ReactNode;
	variant?: "fullscreen" | "fullscreen-muted" | "centered";
	hasFooter?: boolean;
	open?: boolean;
	routePath?: string;
	closeTo?: string;
	content: React.ReactNode;
	showBackButton?: boolean;
	hideLinksInModalFooter?: string[];
	containerClassName?: string;
	contentWrapperClassName?: string;
	contentClassName?: string;
	titleClassName?: string;
	subtitleClassName?: string;
}

export function Modal({
	title,
	subtitle,
	variant = "fullscreen",
	hasFooter = true,
	open = true,
	routePath,
	closeTo,
	content,
	showBackButton,
	hideLinksInModalFooter,
	containerClassName,
	contentWrapperClassName,
	contentClassName,
	titleClassName,
	subtitleClassName,
}: PageModalProps) {
	const router = useRouter();
	const pathname = usePathname();
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

	const handleClose = () => {
		if (closeTo) {
			router.replace(closeTo);
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
			router.push("/");
		}
	};

	const resolvedContentClassName = contentClassName ?? "body2";
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
			variant={variant}
			className="flex flex-col gap-4 items-start space-y-4"
			showBackButton={showBackButton}
			onBack={handleClose}
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
		</Dialog>
	);
}
