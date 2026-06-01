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
		expect(fetchMock).toHaveBeenCalledWith(
			"https://example.test/projects/project-1/terms",
			expect.objectContaining({ cache: "no-store" }),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://example.test/projects/project-1/translations/en",
			expect.objectContaining({ cache: "no-store" }),
		);
	});

	it("rebuilds arrays from Traduora bracket notation terms", async () => {
		process.env.TRADUORA_API_URL = "https://example.test";
		process.env.TRADUORA_PROJECT_ID = "project-1";

		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: [
						{
							id: "term-answer",
							value: "content.infoModal.accordion[0].answer",
						},
						{
							id: "term-question",
							value: "content.infoModal.accordion[0].question",
						},
					],
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: [
						{ termId: "term-answer", value: "Answer text" },
						{ termId: "term-question", value: "Question text" },
					],
				}),
			});

		const result = await fetchTraduoraTranslations("de", "content");

		expect(result).toEqual({
			infoModal: {
				accordion: [
					{
						answer: "Answer text",
						question: "Question text",
					},
				],
			},
		});
	});
});
