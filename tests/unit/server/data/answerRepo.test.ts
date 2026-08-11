import { beforeEach, describe, expect, it, vi } from "vitest";
import { answerRepo } from "@/server/data/answerRepo";
import { prisma } from "@/server/prisma";

vi.mock("@/server/prisma", () => ({
	prisma: {
		answer: {
			findMany: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

const findManyMock = vi.mocked(prisma.answer.findMany);
const createMock = vi.mocked(prisma.answer.create);
const createManyMock = vi.mocked(prisma.answer.createMany);
const deleteMock = vi.mocked(prisma.answer.delete);

const answerInclude = { question: true, institution: true };

describe("answerRepo", () => {
	beforeEach(() => {
		findManyMock.mockReset();
		createMock.mockReset();
		createManyMock.mockReset();
		deleteMock.mockReset();
	});

	describe("createMany", () => {
		it("bulk-creates answers in a single call", async () => {
			const data = [
				{ questionnaire_id: 1, question_id: 2, institution_id: 3, value: "a" },
				{ questionnaire_id: 1, question_id: 4, institution_id: 3, value: "b" },
			];
			createManyMock.mockResolvedValue({ count: 2 } as never);

			await expect(answerRepo.createMany(data as never)).resolves.toEqual({
				count: 2,
			});

			expect(createManyMock).toHaveBeenCalledWith({ data });
		});
	});

	describe("create", () => {
		it("creates an answer with question and institution included", async () => {
			const data = {
				value: "5",
				questionnaire: { connect: { id: 1 } },
				question: { connect: { id: 2 } },
				institution: { connect: { id: 3 } },
			};
			createMock.mockResolvedValue({ id: 1, ...data } as never);

			await answerRepo.create(data as never);

			expect(createMock).toHaveBeenCalledWith(
				expect.objectContaining({ data, include: answerInclude }),
			);
		});
	});

	describe("listByQuestionnaireAndInstitution", () => {
		it("lists all historical answers ordered oldest first", async () => {
			const answers = [{ id: 1, value: "first" }];
			findManyMock.mockResolvedValue(answers as never);

			await expect(
				answerRepo.listByQuestionnaireAndInstitution(1, 3),
			).resolves.toEqual(answers);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { questionnaire_id: 1, institution_id: 3 },
					orderBy: { created_at: "asc" },
					include: answerInclude,
				}),
			);
		});
	});

	describe("listLatestByQuestionnaireAndInstitution", () => {
		it("returns one row per question via distinct + newest-first ordering", async () => {
			const answers = [{ id: 2, value: "second" }];
			findManyMock.mockResolvedValue(answers as never);

			await expect(
				answerRepo.listLatestByQuestionnaireAndInstitution(1, 3),
			).resolves.toEqual(answers);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { questionnaire_id: 1, institution_id: 3 },
					distinct: ["question_id"],
					orderBy: { created_at: "desc" },
					include: answerInclude,
				}),
			);
		});
	});

	describe("listByQuestionnaire", () => {
		it("lists all answers across institutions for export", async () => {
			findManyMock.mockResolvedValue([] as never);

			await answerRepo.listByQuestionnaire(1);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { questionnaire_id: 1 },
					orderBy: { created_at: "asc" },
					include: answerInclude,
				}),
			);
		});
	});

	describe("remove", () => {
		it("deletes an answer by id", async () => {
			deleteMock.mockResolvedValue({ id: 1 } as never);

			await answerRepo.remove(1);

			expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1 } });
		});
	});
});
