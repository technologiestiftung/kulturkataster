import { beforeEach, describe, expect, it, vi } from "vitest";
import { getInstitutionSurveyAnswersForExport } from "@/server/actions/surveys";

const {
	getCurrentUserIdMock,
	authorizeTableMock,
	getAccessContextForUserMock,
	getTableScopeMock,
	findFirstWithSelectMock,
	questionnaireFindByIdMock,
	questionnaireListOpenMock,
	listLatestByQuestionnaireAndInstitutionMock,
	loggerErrorMock,
} = vi.hoisted(() => ({
	getCurrentUserIdMock: vi.fn(),
	authorizeTableMock: vi.fn(),
	getAccessContextForUserMock: vi.fn(),
	getTableScopeMock: vi.fn(),
	findFirstWithSelectMock: vi.fn(),
	questionnaireFindByIdMock: vi.fn(),
	questionnaireListOpenMock: vi.fn(),
	listLatestByQuestionnaireAndInstitutionMock: vi.fn(),
	loggerErrorMock: vi.fn(),
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/utils/rbac", () => ({
	authorizeTable: authorizeTableMock,
	getAccessContextForUser: getAccessContextForUserMock,
	getTableScope: getTableScopeMock,
	getScopeUserId: (scope: "own" | "all", userId: string | null) =>
		scope === "all" ? null : userId,
	createNoAccessWhere: <T extends Record<string, unknown>>(baseWhere?: T) => {
		const noAccessWhere = { id: { equals: -1 } } as unknown as T;
		if (!baseWhere) return noAccessWhere;
		return { AND: [baseWhere, noAccessWhere] } as unknown as T;
	},
}));

vi.mock("@/server/data/institutionRepo", () => ({
	institutionRepo: {
		findFirstWithSelect: findFirstWithSelectMock,
	},
}));

vi.mock("@/server/data/questionnaireRepo", () => ({
	questionnaireRepo: {
		findById: questionnaireFindByIdMock,
		listOpen: questionnaireListOpenMock,
	},
}));

vi.mock("@/server/data/answerRepo", () => ({
	answerRepo: {
		listLatestByQuestionnaireAndInstitution:
			listLatestByQuestionnaireAndInstitutionMock,
	},
}));

vi.mock("@/server/logging/logger", () => ({
	logger: { error: loggerErrorMock },
}));

vi.mock("@/server/logging/requestContext", () => ({
	runWithServerRequestContext: async <T>(fn: () => Promise<T>): Promise<T> =>
		fn(),
	setRequestContext: vi.fn(),
}));

const rbacError = () => {
	const error = new Error("forbidden") as Error & { name: string };
	error.name = "RBACError";
	return error;
};

describe("getInstitutionSurveyAnswersForExport", () => {
	beforeEach(() => {
		getCurrentUserIdMock.mockReset().mockResolvedValue("user-1");
		authorizeTableMock.mockReset();
		getAccessContextForUserMock.mockReset().mockResolvedValue({});
		getTableScopeMock.mockReset().mockReturnValue("all");
		findFirstWithSelectMock
			.mockReset()
			.mockResolvedValue({ id: 42, name: "Kulturort A" });
		questionnaireFindByIdMock.mockReset();
		questionnaireListOpenMock
			.mockReset()
			.mockResolvedValue([{ id: 7, title: "Jahresumfrage 2026" }]);
		listLatestByQuestionnaireAndInstitutionMock.mockReset().mockResolvedValue([
			{
				question: { key: "capacity", label: "Kapazität", step: 1, order: 2 },
				value: 120,
				submitter_name: "Ada Lovelace",
				submitter_email: "ada@example.test",
				created_at: new Date("2026-01-05T00:00:00.000Z"),
			},
			{
				question: { key: "name", label: "Name", step: 1, order: 1 },
				value: "Kulturort A",
				submitter_name: "Ada Lovelace",
				submitter_email: "ada@example.test",
				created_at: new Date("2026-01-05T00:00:00.000Z"),
			},
		]);
		loggerErrorMock.mockReset();
	});

	it("returns rows for the open questionnaire, sorted by question order", async () => {
		const result = await getInstitutionSurveyAnswersForExport(42);

		expect(authorizeTableMock).toHaveBeenCalledWith({}, "answer", "read");
		expect(result).toEqual({
			ok: true,
			data: {
				questionnaireTitle: "Jahresumfrage 2026",
				institutionName: "Kulturort A",
				rows: [
					expect.objectContaining({ questionKey: "name" }),
					expect.objectContaining({ questionKey: "capacity" }),
				],
			},
		});
	});

	it("uses an explicit questionnaireId when provided instead of the open questionnaire", async () => {
		questionnaireFindByIdMock.mockResolvedValue({
			id: 9,
			title: "Sonderumfrage",
		});

		const result = await getInstitutionSurveyAnswersForExport(42, 9);

		expect(questionnaireFindByIdMock).toHaveBeenCalledWith(9);
		expect(questionnaireListOpenMock).not.toHaveBeenCalled();
		expect(result.ok).toBe(true);
		expect(result.ok && result.data.questionnaireTitle).toBe("Sonderumfrage");
	});

	it("returns forbidden when the caller lacks the answer/download permission", async () => {
		authorizeTableMock.mockImplementation(() => {
			throw rbacError();
		});

		const result = await getInstitutionSurveyAnswersForExport(42);

		expect(result).toEqual({ ok: false, error: "forbidden" });
	});

	it("returns forbidden when the institution is outside the caller's scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		findFirstWithSelectMock.mockResolvedValue(null);

		const result = await getInstitutionSurveyAnswersForExport(42);

		expect(result).toEqual({ ok: false, error: "forbidden" });
	});

	it("returns noOpenQuestionnaire when there is no open questionnaire", async () => {
		questionnaireListOpenMock.mockResolvedValue([]);

		const result = await getInstitutionSurveyAnswersForExport(42);

		expect(result).toEqual({ ok: false, error: "noOpenQuestionnaire" });
	});

	it("returns noAnswers when the institution has not answered the questionnaire", async () => {
		listLatestByQuestionnaireAndInstitutionMock.mockResolvedValue([]);

		const result = await getInstitutionSurveyAnswersForExport(42);

		expect(result).toEqual({ ok: false, error: "noAnswers" });
	});

	it("returns unexpected and logs when the answer lookup throws", async () => {
		listLatestByQuestionnaireAndInstitutionMock.mockRejectedValue(
			new Error("db down"),
		);

		const result = await getInstitutionSurveyAnswersForExport(42);

		expect(result).toEqual({ ok: false, error: "unexpected" });
		expect(loggerErrorMock).toHaveBeenCalledWith(
			"survey.export.fetch_failed",
			expect.any(Error),
			expect.objectContaining({ institution_id: 42 }),
		);
	});
});
