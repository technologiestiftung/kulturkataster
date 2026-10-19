import { afterEach, describe, expect, it, vi } from "vitest";

const hasOpenMock = vi.fn();
vi.mock("@/server/data/questionnaireRepo", () => ({
	questionnaireRepo: { hasOpen: hasOpenMock },
}));
vi.mock("@/server/logging/logger", () => ({
	logger: { error: vi.fn() },
}));

// getHiddenMenuItems is cached per request, so each test loads a fresh module.
const loadModule = async () => {
	vi.resetModules();
	return import("@/server/utils/menuVisibility");
};

describe("getHiddenMenuItems", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		hasOpenMock.mockReset();
	});

	it("hides the questionnaire while none is open", async () => {
		vi.stubEnv("HIDDEN_MENU_ITEMS", "download");
		hasOpenMock.mockResolvedValue(false);
		const { getHiddenMenuItems, isQuestionnaireVisible } = await loadModule();

		expect(await getHiddenMenuItems()).toEqual(["download", "questionnaire"]);
		expect(await isQuestionnaireVisible()).toBe(false);
	});

	it("keeps only the configured items while a questionnaire is open", async () => {
		vi.stubEnv("HIDDEN_MENU_ITEMS", "download");
		hasOpenMock.mockResolvedValue(true);
		const { getHiddenMenuItems, isQuestionnaireVisible } = await loadModule();

		expect(await getHiddenMenuItems()).toEqual(["download"]);
		expect(await isQuestionnaireVisible()).toBe(true);
	});

	it("keeps the questionnaire when the check fails", async () => {
		hasOpenMock.mockRejectedValue(new Error("db down"));
		const { getHiddenMenuItems } = await loadModule();

		expect(await getHiddenMenuItems()).toEqual([]);
	});
});
