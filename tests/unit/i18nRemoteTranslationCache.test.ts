import { describe, expect, it, vi, afterEach } from "vitest";

describe("remote translation cache", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it("retries after a failed remote translation load", async () => {
		vi.stubEnv("TRADUORA_TRANSLATION_CACHE_TTL_MS", "60000");

		const fetchTranslations = vi
			.fn()
			.mockRejectedValueOnce(new Error("Traduora unavailable"))
			.mockResolvedValueOnce({
				content: {
					infoModal: {
						accordion: [
							{
								answer: "Remote answer",
								question: "Remote question",
							},
						],
					},
				},
			});

		vi.doMock("@/server/actions/fetchTranslations", () => ({
			fetchTranslations,
		}));

		const { serverSideTranslation } = await import("@/i18n");

		await serverSideTranslation("de");
		const { t } = await serverSideTranslation("de");

		expect(fetchTranslations).toHaveBeenCalledTimes(2);
		expect(t("content.infoModal.accordion.0.question")).toBe("Remote question");
	});
});
