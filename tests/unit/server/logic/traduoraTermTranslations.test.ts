import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getCategoryEnumMapTermKey,
	getEnumMapTermTranslations,
	upsertEnumMapTermTranslations,
} from "@/server/logic/traduoraTermTranslations";

const fetchTraduoraTokenMock = vi.fn().mockResolvedValue("token");

vi.mock("@/server/traduora/cached", () => ({
	fetchTraduoraToken: () => fetchTraduoraTokenMock(),
}));

describe("traduoraTermTranslations", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		process.env.TRADUORA_API_URL = "https://traduora.test";
		process.env.TRADUORA_PROJECT_ID = "project-1";
	});

	it("builds enumMap term keys for categories and child categories", () => {
		expect(
			getCategoryEnumMapTermKey({ key: "music", parentCategoryId: null }),
		).toBe("category.music");
		expect(
			getCategoryEnumMapTermKey({ key: "clubs", parentCategoryId: 1 }),
		).toBe("category.clubs");
	});

	it("reads term translations by locale", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: [{ id: "term-1", value: "enumMap.category.music" }],
					}),
					{ status: 200 },
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: [{ termId: "term-1", value: "Musik" }],
					}),
					{ status: 200 },
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: [{ termId: "term-1", value: "Music" }],
					}),
					{ status: 200 },
				),
			);

		const result = await getEnumMapTermTranslations({
			termKey: "category.music",
			locales: ["de", "en"],
		});

		expect(result).toEqual({ de: "Musik", en: "Music" });
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it("upserts term and only writes non-empty translations", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						data: [{ id: "term-1", value: "enumMap.category.music" }],
					}),
					{ status: 200 },
				),
			)
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }));

		await upsertEnumMapTermTranslations({
			termKey: "category.music",
			translations: {
				de: "Musik",
				en: "",
			},
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/terms");
		const patchCall = fetchMock.mock.calls.find((call) =>
			String(call[0]).includes("/translations/de"),
		);
		expect(patchCall).toBeTruthy();
	});
});
