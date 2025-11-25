"use client";

import { useEffect, useRef } from "react";

/**
 * Remembers the currently focused element when a controlled surface opens
 * and restores focus to it once the surface closes.
 */
export function useRestoreFocus(isOpen: boolean | undefined) {
	const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
	const wasOpenRef = useRef(false);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		if (typeof isOpen !== "boolean") {
			wasOpenRef.current = Boolean(isOpen);
			return;
		}

		if (isOpen && !wasOpenRef.current) {
			previouslyFocusedElementRef.current =
				(document.activeElement as HTMLElement | null) ?? null;
		}

		if (!isOpen && wasOpenRef.current && previouslyFocusedElementRef.current) {
			previouslyFocusedElementRef.current.focus();
			previouslyFocusedElementRef.current = null;
		}

		wasOpenRef.current = isOpen;
	}, [isOpen]);

	useEffect(() => {
		return () => {
			if (wasOpenRef.current && previouslyFocusedElementRef.current) {
				previouslyFocusedElementRef.current.focus();
				previouslyFocusedElementRef.current = null;
				wasOpenRef.current = false;
			}
		};
	}, []);
}
