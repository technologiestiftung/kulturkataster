import { beforeEach, describe, expect, it, vi } from "vitest";

const { listOpenMock, findByIdMock, createManyMock, getCurrentUserIdMock, loggerWarn, loggerError } =
	vi.hoisted(() => ({
		listOpenMock: vi.fn(),
		findByIdMock: vi.fn(),
		createManyMock: vi.fn(),
		getCurrentUserIdMock: vi.fn(),
		loggerWarn: vi.fn(),
		loggerError: vi.fn(),
	}));

vi.mock("@/server/data/questionnaireRepo", () => ({
	questionnaireRepo: {
		listOpen: listOpenMock,
		findById: findByIdMock,
	},
}));

vi.mock("@/server/data/answerRepo", () => ({
	answerRepo: {
		createMany: createManyMock,
	},
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		warn: loggerWarn,
		error: loggerError,
	},
}));

import {
	getOpenQuestionnaire,
	submitQuestionnaireAnswers,
} from "@/server/actions/questionnaires";

describe("server actions: questionnaires", () => {
	beforeEach(() => {
		listOpenMock.mockReset();
		findByIdMock.mockReset();
		createManyMock.mockReset();
		getCurrentUserIdMock.mockReset();
		loggerWarn.mockReset();
		loggerError.mockReset();
	});

	describe("getOpenQuestionnaire", () => {
		it("returns the open questionnaire with its questions", async () => {
			listOpenMock.mockResolvedValue([{ id: 1, title: "Survey" }]);
			findByIdMock.mockResolvedValue({
				id: 1,
				title: "Survey",
				questions: [{ id: 1, key: "q1" }],
			});

			const result = await getOpenQuestionnaire();

			expect(result).toEqual({
				ok: true,
				questionnaire: {
					id: 1,
					title: "Survey",
					questions: [{ id: 1, key: "q1" }],
				},
			});
			expect(findByIdMock).toHaveBeenCalledWith(1);
		});

		it("returns not_found when no questionnaire is open", async () => {
			listOpenMock.mockResolvedValue([]);

			await expect(getOpenQuestionnaire()).resolves.toEqual({
				ok: false,
				error: "not_found",
			});
			expect(findByIdMock).not.toHaveBeenCalled();
		});

		it("warns and uses the first questionnaire when more than one is open", async () => {
			listOpenMock.mockResolvedValue([{ id: 1 }, { id: 2 }]);
			findByIdMock.mockResolvedValue({ id: 1, title: "Survey", questions: [] });

			await getOpenQuestionnaire();

			expect(findByIdMock).toHaveBeenCalledWith(1);
			expect(loggerWarn).toHaveBeenCalledWith(
				"questionnaire.multiple_open",
				expect.objectContaining({ count: 2 }),
			);
		});

		it("returns unexpected on repo failure", async () => {
			listOpenMock.mockRejectedValue(new Error("db down"));

			await expect(getOpenQuestionnaire()).resolves.toEqual({
				ok: false,
				error: "unexpected",
			});
			expect(loggerError).toHaveBeenCalled();
		});
	});

	describe("submitQuestionnaireAnswers", () => {
		const baseParams = {
			questionnaireId: 1,
			institutionId: 2,
			answers: [
				{ questionId: 10, value: "yes" },
				{ questionId: 11, value: 5 },
			],
		};

		it("stores created_by from the logged-in user and no submitter fields", async () => {
			getCurrentUserIdMock.mockResolvedValue("user-1");
			createManyMock.mockResolvedValue({ count: 2 });

			await expect(submitQuestionnaireAnswers(baseParams)).resolves.toEqual({
				ok: true,
			});

			expect(createManyMock).toHaveBeenCalledWith([
				{
					questionnaire_id: 1,
					question_id: 10,
					institution_id: 2,
					value: "yes",
					created_by: "user-1",
					submitter_name: undefined,
					submitter_email: undefined,
				},
				{
					questionnaire_id: 1,
					question_id: 11,
					institution_id: 2,
					value: 5,
					created_by: "user-1",
					submitter_name: undefined,
					submitter_email: undefined,
				},
			]);
		});

		it("stores submitter_name/email and null created_by for a guest", async () => {
			getCurrentUserIdMock.mockResolvedValue(null);
			createManyMock.mockResolvedValue({ count: 1 });

			await submitQuestionnaireAnswers({
				questionnaireId: 1,
				institutionId: 2,
				answers: [{ questionId: 10, value: "yes" }],
				submitterName: "Jane Doe",
				submitterEmail: "jane@example.test",
			});

			expect(createManyMock).toHaveBeenCalledWith([
				{
					questionnaire_id: 1,
					question_id: 10,
					institution_id: 2,
					value: "yes",
					created_by: null,
					submitter_name: "Jane Doe",
					submitter_email: "jane@example.test",
				},
			]);
		});

		it("returns unexpected on repo failure", async () => {
			getCurrentUserIdMock.mockResolvedValue(null);
			createManyMock.mockRejectedValue(new Error("db down"));

			await expect(
				submitQuestionnaireAnswers(baseParams),
			).resolves.toEqual({ ok: false, error: "unexpected" });
			expect(loggerError).toHaveBeenCalled();
		});
	});
});
