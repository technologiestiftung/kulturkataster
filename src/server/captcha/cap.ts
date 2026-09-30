import { getCurrentUserId } from "@/server/actions/auth";
import { logger } from "@/server/logging/logger";
import type { CaptchaWidgetConfig } from "@/types/captcha";

// Cap Standalone (https://trycap.dev) protects guest form submissions. All
// three values are read at request time, so they can be set per deployment
// without a rebuild. Without them the captcha is off (widget hidden, server
// check skipped).
const VERIFY_TIMEOUT_MS = 5000;
const MAX_TOKEN_LENGTH = 4096;

type CapServerConfig = {
	baseUrl: string;
	siteKey: string;
	secretKey: string;
};

const readCapServerConfig = (): CapServerConfig | null => {
	const baseUrl = process.env.CAP_URL?.trim().replace(/\/+$/, "");
	const siteKey = process.env.CAP_SITE_KEY?.trim();
	const secretKey = process.env.CAP_SECRET_KEY?.trim();
	if (!baseUrl || !siteKey || !secretKey) return null;
	return { baseUrl, siteKey, secretKey };
};

// Only the public parts: the widget's endpoint and the WASM files, which the
// Cap server's asset server hosts so browsers don't fetch them from a CDN.
export const getCapWidgetConfig = (): CaptchaWidgetConfig | null => {
	const config = readCapServerConfig();
	if (!config) return null;
	return {
		apiEndpoint: `${config.baseUrl}/${config.siteKey}/`,
		wasmUrl: `${config.baseUrl}/assets/cap_wasm_bg.wasm`,
		hashwxUrl: `${config.baseUrl}/assets/hashwx.wasm`,
	};
};

// For server components: the widget config if the visitor is a guest, else null.
export const getGuestCaptchaWidgetConfig =
	async (): Promise<CaptchaWidgetConfig | null> =>
		(await getCurrentUserId()) ? null : getCapWidgetConfig();

// Tokens are single-use: Cap deletes them on verification, so call this once
// per submission, before any side effect. Fails closed on any error.
const verifyCapToken = async (
	config: CapServerConfig,
	token: string,
): Promise<boolean> => {
	try {
		const response = await fetch(
			`${config.baseUrl}/${config.siteKey}/siteverify`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ secret: config.secretKey, response: token }),
				signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
				cache: "no-store",
			},
		);
		if (!response.ok) {
			logger.warn("captcha.verify.rejected", {
				subsystem: "captcha",
				status: response.status,
			});
			return false;
		}
		const body = (await response.json()) as { success?: unknown };
		return body.success === true;
	} catch (error) {
		logger.error("captcha.verify.failed", error, { subsystem: "captcha" });
		return false;
	}
};

// Logged-in users never need a captcha; guests do whenever Cap is configured.
export const isGuestCaptchaSatisfied = async (
	currentUserId: string | null,
	token: unknown,
): Promise<boolean> => {
	if (currentUserId) return true;
	const config = readCapServerConfig();
	if (!config) return true;
	if (
		typeof token !== "string" ||
		token.length === 0 ||
		token.length > MAX_TOKEN_LENGTH
	) {
		return false;
	}
	return verifyCapToken(config, token);
};
