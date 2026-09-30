import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getCapWidgetConfig,
	isGuestCaptchaSatisfied,
} from "@/server/captcha/cap";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn(),
}));

vi.mock("@/server/logging/logger", () => ({
	logger: { warn: vi.fn(), error: vi.fn() },
}));

const fetchMock = vi.fn();

const configureCap = () => {
	vi.stubEnv("CAP_URL", "https://cap.example.org/");
	vi.stubEnv("CAP_SITE_KEY", "a1b2c3d4e5");
	vi.stubEnv("CAP_SECRET_KEY", "sk-test-secret");
};

const siteverifyResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("Cap captcha", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
		vi.stubEnv("CAP_URL", "");
		vi.stubEnv("CAP_SITE_KEY", "");
		vi.stubEnv("CAP_SECRET_KEY", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	describe("getCapWidgetConfig", () => {
		it("is null while Cap is not configured", () => {
			expect(getCapWidgetConfig()).toBeNull();
		});

		it("exposes only public values, with the trailing slash the widget needs", () => {
			configureCap();

			expect(getCapWidgetConfig()).toEqual({
				apiEndpoint: "https://cap.example.org/a1b2c3d4e5/",
				wasmUrl: "https://cap.example.org/assets/cap_wasm_bg.wasm",
				hashwxUrl: "https://cap.example.org/assets/hashwx.wasm",
			});
		});
	});

	describe("isGuestCaptchaSatisfied", () => {
		it("never requires a captcha from logged-in users", async () => {
			configureCap();

			await expect(isGuestCaptchaSatisfied("user-1", undefined)).resolves.toBe(
				true,
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("lets guests through while Cap is not configured", async () => {
			await expect(isGuestCaptchaSatisfied(null, undefined)).resolves.toBe(
				true,
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("rejects a guest without a token without calling Cap", async () => {
			configureCap();

			await expect(isGuestCaptchaSatisfied(null, "")).resolves.toBe(false);
			await expect(isGuestCaptchaSatisfied(null, null)).resolves.toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("verifies the token with the secret key via siteverify", async () => {
			configureCap();
			fetchMock.mockResolvedValue(siteverifyResponse({ success: true }));

			await expect(isGuestCaptchaSatisfied(null, "token-1")).resolves.toBe(
				true,
			);
			expect(fetchMock).toHaveBeenCalledTimes(1);
			const [url, init] = fetchMock.mock.calls[0] as [
				string,
				Parameters<typeof fetch>[1] & { body: string },
			];
			expect(url).toBe("https://cap.example.org/a1b2c3d4e5/siteverify");
			expect(init?.method).toBe("POST");
			expect(JSON.parse(init.body)).toEqual({
				secret: "sk-test-secret",
				response: "token-1",
			});
		});

		it("rejects a token Cap does not accept", async () => {
			configureCap();
			fetchMock.mockResolvedValue(
				siteverifyResponse({ success: false, error: "Token not found" }),
			);

			await expect(isGuestCaptchaSatisfied(null, "used-token")).resolves.toBe(
				false,
			);
		});

		it("fails closed when Cap errors or is unreachable", async () => {
			configureCap();
			fetchMock.mockResolvedValueOnce(siteverifyResponse({}, 500));
			await expect(isGuestCaptchaSatisfied(null, "token-1")).resolves.toBe(
				false,
			);

			fetchMock.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
			await expect(isGuestCaptchaSatisfied(null, "token-1")).resolves.toBe(
				false,
			);
		});
	});
});
