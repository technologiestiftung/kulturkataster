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

const categoryGroups = [{ id: 1, key: "museums" }];
const getCategoriesWithSubcategoriesMock = vi
	.fn()
	.mockResolvedValue(categoryGroups);
vi.mock("@/server/actions/categories", () => ({
	getCategoriesWithSubcategories: getCategoriesWithSubcategoriesMock,
}));

describe("questionnaire page integration", () => {
	it("renders the wizard modal when a questionnaire is open", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({}),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({
				routePath: "/questionnaire",
				questionnaire: { id: 1, title: "Survey", questions: [] },
				categoryGroups,
				initialInstitutionId: undefined,
				initialSubmissionId: undefined,
				initialStepId: undefined,
				initialShowThankYou: false,
			}),
		});
	});

	it("parses ?thankyou=1 the same way /institution does", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({ thankyou: "1" }),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({ initialShowThankYou: true }),
		});
	});

	it("also accepts ?thankyou=true", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({ thankyou: "true" }),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({ initialShowThankYou: true }),
		});
	});

	it("parses institutionId/submissionId/step search params through to the wizard modal", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({
				institutionId: "42",
				step: "block-1",
			}),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({
				initialInstitutionId: 42,
				initialSubmissionId: undefined,
				initialStepId: "block-1",
			}),
		});
	});

	it("ignores a non-numeric institutionId search param", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({ institutionId: "not-a-number" }),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({ initialInstitutionId: undefined }),
		});
	});

	it("takes the first value when a search param is repeated (Next.js hands back an array)", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: true,
			questionnaire: { id: 1, title: "Survey", questions: [] },
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({
				institutionId: ["42", "43"],
				step: ["block-1", "block-2"],
			}),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({
				initialInstitutionId: 42,
				initialStepId: "block-1",
			}),
		});
	});

	it("renders the unavailable screen when no questionnaire is open", async () => {
		getOpenQuestionnaireMock.mockResolvedValue({
			ok: false,
			error: "not_found",
		});

		const pageModule = await import("@/app/[locale]/questionnaire/page");
		const result = await pageModule.default({
			searchParams: Promise.resolve({}),
		});

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
		const result = await pageModule.default({
			searchParams: Promise.resolve({ submissionId: "7", thankyou: "1" }),
		});

		expect(result).toMatchObject({
			type: QuestionnaireWizardModal,
			props: expect.objectContaining({
				routePath: "/questionnaire",
				categoryGroups,
				initialSubmissionId: 7,
				initialShowThankYou: true,
			}),
		});
	});
});
