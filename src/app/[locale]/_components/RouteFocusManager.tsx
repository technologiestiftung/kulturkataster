"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const MAIN_CONTENT_ID = "main-content";
const OPEN_DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';
// Lets dialogs (Radix focus scopes) and Next.js finish their own focus handling first.
const FOCUS_CHECK_DELAY_MS = 50;

const isFocusLost = () => {
	const active = document.activeElement;
	return !active || active === document.body || !active.isConnected;
};

/**
 * Keeps keyboard and screen reader users oriented after client-side
 * navigation. Next.js already announces the new document title; this only
 * moves focus to the main landmark when the previously focused element was
 * removed (focus fell back to <body>). Focus is never taken away from an
 * open dialog or from an element that is still focused.
 */
export function RouteFocusManager() {
	const pathname = usePathname();
	const previousPathnameRef = useRef(pathname);

	useEffect(() => {
		if (previousPathnameRef.current === pathname) return;
		previousPathnameRef.current = pathname;

		const timeoutId = window.setTimeout(() => {
			if (document.querySelector(OPEN_DIALOG_SELECTOR)) return;
			if (!isFocusLost()) return;
			document.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true });
		}, FOCUS_CHECK_DELAY_MS);

		return () => window.clearTimeout(timeoutId);
	}, [pathname]);

	return null;
}
