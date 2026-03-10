"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
};

export function ScrollReveal({
	children,
	className,
	disabled = false,
}: ScrollRevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(disabled);

	useEffect(() => {
		if (disabled) {
			setIsVisible(true);
			return;
		}

		if (typeof IntersectionObserver === "undefined") {
			setIsVisible(true);
			return;
		}

		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
		);

		observer.observe(element);

		return () => observer.disconnect();
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
