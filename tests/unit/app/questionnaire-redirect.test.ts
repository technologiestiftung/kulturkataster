import { describe, expect, it, vi } from "vitest";
import { QuestionnaireUnavailable } from "@/components/Questionnaire/QuestionnaireUnavailable";

vi.mock("@/components/Questionnaire/QuestionnaireWizardModal", () => ({
	QuestionnaireWizardModal: () => null,
}));
vi.mock("@/components/Questionnaire/QuestionnaireUnavailable", () => ({
	QuestionnaireUnavailable: () => null,
}));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`NEXT_REDIRECT ${url}`);
	},
}));
const getOpenQuestionnaireMock = vi.fn();
vi.mock("@/server/actions/questionnaires", () => ({
	getOpenQuestionnaire: getOpenQuestionnaireMock,
}));
vi.mock("@/server/actions/categories", () => ({
	getCategoriesWithSubcategories: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/server/captcha/cap", () => ({
	getGuestCaptchaWidgetConfig: vi.fn().mockResolvedValue(null),
}));

const routes = [
	"@/app/[locale]/questionnaire/page",
	"@/app/[locale]/@modal/(.)questionnaire/page",
];

const renderRoute = async (path: string, locale = "de") =>
	(await import(path)).default({
		params: Promise.resolve({ locale }),
		searchParams: Promise.resolve({}),
	});

describe("/questionnaire without an open questionnaire", () => {
	it.each(routes)("%s redirects to the localized map", async (path) => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: false,
			error: "not_found",
		});

		await expect(renderRoute(path, "en")).rejects.toThrow(
			"NEXT_REDIRECT /en/map",
		);
	});

	it.each(routes)(
		"%s still shows the unavailable screen on a loading error",
		async (path) => {
			getOpenQuestionnaireMock.mockResolvedValue({
				ok: false,
				error: "unexpected",
			});

			expect(await renderRoute(path)).toMatchObject({
				type: QuestionnaireUnavailable,
			});
		},
	);
});
