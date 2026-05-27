import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchTraduoraTokenMock = vi.fn().mockResolvedValue("token");

vi.mock("@/server/traduora/cached", () => ({
	fetchTraduoraToken: () => fetchTraduoraTokenMock(),
}));

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

import { fetchTraduoraTranslations } from "@/server/logic/traduoraTranslations";

describe("fetchTraduoraTranslations", () => {
	beforeEach(() => {
		fetchMock.mockReset();
	});

	it("builds translation map for terms", async () => {
		process.env.TRADUORA_API_URL = "https://example.test";
		process.env.TRADUORA_PROJECT_ID = "project-1";

		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: [{ id: "term-1", value: "content.welcome.title" }],
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: [{ termId: "term-1", value: "Hello" }],
				}),
			});

		const result = await fetchTraduoraTranslations("en", "content");
		expect(result).toHaveProperty("welcome.title", "Hello");
	});
});
