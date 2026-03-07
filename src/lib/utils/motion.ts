export function getAccessibleScrollBehavior(): "auto" | "smooth" {
	if (typeof window === "undefined") {
		return "auto";
	}

	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
		? "auto"
		: "smooth";
}
