"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
	children: React.ReactNode;
	className?: string;
	/** Classes for the inner wrapper around `children`, e.g. to pass a subgrid through. */
	contentClassName?: string;
	disabled?: boolean;
};

export function ScrollReveal({
	children,
	className,
	contentClassName,
	disabled = false,
}: ScrollRevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(disabled);

	useEffect(() => {
		if (disabled) {
			setIsVisible(true);
			return;
		}

		const element = ref.current;
		if (!element) return;

		const revealIfInViewport = () => {
			const rect = element.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			if (rect.bottom >= 0 && rect.top <= viewportHeight) {
				setIsVisible(true);
				return true;
			}
			return false;
		};

		if (revealIfInViewport()) return;

		let observer: IntersectionObserver | null = null;
		if (typeof IntersectionObserver !== "undefined") {
			observer = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;
					if (entry?.isIntersecting) {
						setIsVisible(true);
					}
				},
				{ threshold: 0, rootMargin: "0px 0px -1% 0px" },
			);
			observer.observe(element);
		}

		const handleViewportChange = () => {
			if (revealIfInViewport()) {
				observer?.disconnect();
			}
		};

		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(handleViewportChange)
				: null;
		resizeObserver?.observe(element);

		window.addEventListener("scroll", handleViewportChange, { passive: true });
		window.addEventListener("resize", handleViewportChange);

		// Accordion/content transitions can delay layout updates by a frame.
		const rafId = window.requestAnimationFrame(handleViewportChange);

		return () => {
			window.cancelAnimationFrame(rafId);
			window.removeEventListener("scroll", handleViewportChange);
			window.removeEventListener("resize", handleViewportChange);
			resizeObserver?.disconnect();
			observer?.disconnect();
		};
	}, [disabled]);

	return (
		<div ref={ref} className={cn("relative", className)}>
			{!isVisible && (
				<div className="pointer-events-none absolute inset-0 z-10">
					<Skeleton className="h-full w-full rounded-md" />
				</div>
			)}
			<div
				className={cn(
					"motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out",
					contentClassName,
					isVisible
						? "motion-safe:opacity-100 motion-safe:translate-y-0"
						: "motion-safe:opacity-0 motion-safe:translate-y-3",
				)}
			>
				{children}
			</div>
		</div>
	);
}
