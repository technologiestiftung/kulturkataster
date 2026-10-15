import { beforeEach, describe, expect, it, vi } from "vitest";
import { questionRepo } from "@/server/data/questionRepo";
import { prisma } from "@/server/prisma";

vi.mock("@/server/prisma", () => ({
	prisma: {
		question: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

const findManyMock = vi.mocked(prisma.question.findMany);
const findUniqueMock = vi.mocked(prisma.question.findUnique);
const createMock = vi.mocked(prisma.question.create);
const updateMock = vi.mocked(prisma.question.update);
const deleteMock = vi.mocked(prisma.question.delete);

describe("questionRepo", () => {
	beforeEach(() => {
		findManyMock.mockReset();
		findUniqueMock.mockReset();
		createMock.mockReset();
		updateMock.mockReset();
		deleteMock.mockReset();
	});

	describe("listByQuestionnaire", () => {
		it("lists questions for a questionnaire ordered by step then order", async () => {
			const questions = [{ id: 1, key: "stability" }];
			findManyMock.mockResolvedValue(questions as never);

			await expect(questionRepo.listByQuestionnaire(5)).resolves.toEqual(
				questions,
			);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { questionnaire_id: 5 },
					orderBy: [{ step: "asc" }, { order: "asc" }],
				}),
			);
		});
	});

	describe("findById", () => {
		it("finds a question by id", async () => {
			const question = { id: 1, key: "stability" };
			findUniqueMock.mockResolvedValue(question as never);

			await expect(questionRepo.findById(1)).resolves.toEqual(question);

			expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 1 } });
		});
	});

	describe("create", () => {
		it("creates a question", async () => {
			const data = {
				key: "stability",
				label: "How stable?",
				field_type: "likert",
				questionnaire: { connect: { id: 5 } },
			};
			createMock.mockResolvedValue({ id: 1, ...data } as never);

			await questionRepo.create(data as never);

			expect(createMock).toHaveBeenCalledWith(
				expect.objectContaining({ data }),
			);
		});
	});

	describe("update", () => {
		it("updates a question by id", async () => {
			const data = { label: "Updated label" };
			updateMock.mockResolvedValue({ id: 1, ...data } as never);

			await questionRepo.update(1, data as never);

			expect(updateMock).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: 1 }, data }),
			);
		});
	});

	describe("remove", () => {
		it("deletes a question by id", async () => {
			deleteMock.mockResolvedValue({ id: 1 } as never);

			await questionRepo.remove(1);

			expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1 } });
		});
	});
});
