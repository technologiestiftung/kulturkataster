"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { CaptchaWidgetConfig } from "@/types/captcha";

type CapSolveEvent = CustomEvent<{ token: string }>;

// Cap's <cap-widget> web component. The element is defined by importing
// cap-widget on the client only (it touches window), and the WASM solvers load
// from the Cap server's asset server instead of the default CDN.
export function CaptchaWidget({
	config,
	onTokenChange,
}: {
	config: CaptchaWidgetConfig;
	onTokenChange: (token: string | null) => void;
}) {
	const { t } = useTranslation();
	const widgetRef = useRef<HTMLElement>(null);

	useEffect(() => {
		window.CAP_CUSTOM_WASM_URL = config.wasmUrl;
		window.CAP_CUSTOM_HASHWX_URL = config.hashwxUrl;
		void import("cap-widget");
	}, [config.wasmUrl, config.hashwxUrl]);

	useEffect(() => {
		const widget = widgetRef.current;
		if (!widget) return;
		const handleSolve = (event: Event) =>
			onTokenChange((event as CapSolveEvent).detail.token);
		const handleClear = () => onTokenChange(null);
		widget.addEventListener("solve", handleSolve);
		widget.addEventListener("reset", handleClear);
		widget.addEventListener("error", handleClear);
		return () => {
			widget.removeEventListener("solve", handleSolve);
			widget.removeEventListener("reset", handleClear);
			widget.removeEventListener("error", handleClear);
		};
	}, [onTokenChange]);

	return (
		<cap-widget
			ref={widgetRef}
			data-cap-api-endpoint={config.apiEndpoint}
			data-cap-i18n-initial-state={t("common.captcha.initial")}
			data-cap-i18n-verifying-label={t("common.captcha.verifying")}
			data-cap-i18n-solved-label={t("common.captcha.solved")}
			data-cap-i18n-error-label={t("common.captcha.error")}
			data-cap-i18n-troubleshooting-label={t("common.captcha.troubleshooting")}
			data-cap-i18n-wasm-disabled={t("common.captcha.wasmDisabled")}
			data-cap-i18n-verify-aria-label={t("common.captcha.verifyAriaLabel")}
			data-cap-i18n-verifying-aria-label={t(
				"common.captcha.verifyingAriaLabel",
			)}
			data-cap-i18n-verified-aria-label={t("common.captcha.verifiedAriaLabel")}
			data-cap-i18n-error-aria-label={t("common.captcha.errorAriaLabel")}
			data-cap-i18n-required-label={t("common.captcha.required")}
		/>
	);
}
