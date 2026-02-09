import type { Page } from "@playwright/test";

export async function prepareStableUi(page: Page) {
	await page.addInitScript(() => {
		try {
			const persistedState = {
				state: {
					firstTimeUser: false,
					viewMode: "map",
					isContrastMode: false,
					isLargeTextMode: false,
					baseFontSize: 16,
				},
				version: 0,
			};
			window.localStorage.setItem("app-storage", JSON.stringify(persistedState));
		} catch {
			// Ignore storage errors in restricted contexts.
		}

		const injectNoMotionStyles = () => {
			const style = document.createElement("style");
			style.setAttribute("data-e2e-no-motion", "true");
			style.innerHTML = `
				*, *::before, *::after {
					animation-duration: 0s !important;
					animation-delay: 0s !important;
					transition-duration: 0s !important;
					scroll-behavior: auto !important;
				}
			`;
			document.head.appendChild(style);
		};

		if (document.head) {
			injectNoMotionStyles();
		} else {
			document.addEventListener("DOMContentLoaded", injectNoMotionStyles, {
				once: true,
			});
		}
	});
}
