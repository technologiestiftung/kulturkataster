import { describe, expect, it, vi } from "vitest";
import { QuestionnaireWizardModal } from "@/components/Questionnaire/QuestionnaireWizardModal";
import { QuestionnaireUnavailable } from "@/components/Questionnaire/QuestionnaireUnavailable";

vi.mock("@/components/Questionnaire/QuestionnaireWizardModal", () => ({
	QuestionnaireWizardModal: () => null,
}));

vi.mock("@/components/Questionnaire/QuestionnaireUnavailable", () => ({
	QuestionnaireUnavailable: () => null,
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentProfile: vi.fn().mockResolvedValue(null),
}));

const getOpenQuestionnaireMock = vi.fn();
vi.mock("@/server/actions/questionnaires", () => ({
	getOpenQuestionnaire: getOpenQuestionnaireMock,
}));

describe("questionnaire page integration", () => {
	it("renders the wizard modal when a questionnaire is open", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default();

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({
				routePath: "/questionnaire",
				questionnaire: { id: 1, title: "Survey", questions: [] },
			}),
		});
	});

	it("renders the unavailable screen when no questionnaire is open", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: false,
			error: "not_found",
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default();

		expect(result).toMatchObject({ type: QuestionnaireUnavailable });
	});

	it("mirrors the same behavior for the @modal intercepted route", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import(
			"@/app/[locale]/@modal/(.)questionnaire/page"
		);
		const result = await pageModule.default();

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({ routePath: "/questionnaire" }),
		});
	});
});
