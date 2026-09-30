"use client";

import { useCallback, useState } from "react";
import { CaptchaWidget } from "@/components/Captcha/CaptchaWidget";
import type { CaptchaWidgetConfig } from "@/types/captcha";

// `config` comes from the server and is null for logged-in users or when Cap is
// not configured; then nothing is rendered and nothing is required.
export function useGuestCaptcha(config: CaptchaWidgetConfig | null) {
	const [token, setToken] = useState<string | null>(null);
	const [widgetKey, setWidgetKey] = useState(0);

	// Tokens are single-use: after any submit attempt the widget has to be solved
	// again, so it is remounted in its initial state.
	const reset = useCallback(() => {
		setToken(null);
		setWidgetKey((key) => key + 1);
	}, []);

	const widget = config ? (
		<CaptchaWidget key={widgetKey} config={config} onTokenChange={setToken} />
	) : null;

	return {
		widget,
		token,
		isSolved: config === null || token !== null,
		reset,
	};
}
