const REDUCED_MOTION_ATTRIBUTE = "data-reduced-motion";

export function applyReducedMotionPreference(enabled: boolean) {
	if (typeof document === "undefined") return;

	if (enabled) {
		document.documentElement.setAttribute(REDUCED_MOTION_ATTRIBUTE, "true");
		return;
	}

	document.documentElement.removeAttribute(REDUCED_MOTION_ATTRIBUTE);
}

export function isReducedMotionEnabled(): boolean {
	if (typeof window === "undefined") {
		return true;
	}

	const hasManualReducedMotionPreference =
		document.documentElement.getAttribute(REDUCED_MOTION_ATTRIBUTE) === "true";
	if (hasManualReducedMotionPreference) {
		return true;
	}

	if (typeof window.matchMedia !== "function") {
		return false;
	}

	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getAccessibleScrollBehavior(): "auto" | "smooth" {
	return isReducedMotionEnabled() ? "auto" : "smooth";
}
