import { beforeEach, describe, expect, it, vi } from "vitest";
import { questionnaireRepo } from "@/server/data/questionnaireRepo";
import { prisma } from "@/server/prisma";

vi.mock("@/server/prisma", () => ({
	prisma: {
		questionnaire: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

const findManyMock = vi.mocked(prisma.questionnaire.findMany);
const findUniqueMock = vi.mocked(prisma.questionnaire.findUnique);
const createMock = vi.mocked(prisma.questionnaire.create);
const updateMock = vi.mocked(prisma.questionnaire.update);
const deleteMock = vi.mocked(prisma.questionnaire.delete);

describe("questionnaireRepo", () => {
	beforeEach(() => {
		findManyMock.mockReset();
		findUniqueMock.mockReset();
		createMock.mockReset();
		updateMock.mockReset();
		deleteMock.mockReset();
	});

	describe("list", () => {
		it("lists questionnaires ordered by created_at desc", async () => {
			const questionnaires = [{ id: 1, title: "Test" }];
			findManyMock.mockResolvedValue(questionnaires as never);

			await expect(questionnaireRepo.list()).resolves.toEqual(questionnaires);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: undefined,
					take: 100,
					orderBy: { created_at: "desc" },
				}),
			);
		});

		it("passes through a custom where and take", async () => {
			findManyMock.mockResolvedValue([] as never);

			await questionnaireRepo.list({ status: "open" }, 10);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { status: "open" },
					take: 10,
				}),
			);
		});
	});

	describe("listOpen", () => {
		it("filters to status open", async () => {
			findManyMock.mockResolvedValue([] as never);

			await questionnaireRepo.listOpen();

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { status: "open" },
					orderBy: { created_at: "desc" },
				}),
			);
		});
	});

	describe("findById", () => {
		it("includes questions ordered by step then order", async () => {
			const questionnaire = { id: 1, title: "Test", questions: [] };
			findUniqueMock.mockResolvedValue(questionnaire as never);

			await expect(questionnaireRepo.findById(1)).resolves.toEqual(
				questionnaire,
			);

			expect(findUniqueMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 1 },
					include: {
						questions: { orderBy: [{ step: "asc" }, { order: "asc" }] },
					},
				}),
			);
		});
	});

	describe("create", () => {
		it("creates a questionnaire", async () => {
			const data = { title: "New Questionnaire" };
			createMock.mockResolvedValue({ id: 1, ...data } as never);

			await questionnaireRepo.create(data as never);

			expect(createMock).toHaveBeenCalledWith(
				expect.objectContaining({ data }),
			);
		});
	});

	describe("update", () => {
		it("updates a questionnaire by id", async () => {
			const data = { title: "Updated" };
			updateMock.mockResolvedValue({ id: 1, ...data } as never);

			await questionnaireRepo.update(1, data as never);

			expect(updateMock).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: 1 }, data }),
			);
		});
	});

	describe("remove", () => {
		it("deletes a questionnaire by id", async () => {
			deleteMock.mockResolvedValue({ id: 1 } as never);

			await questionnaireRepo.remove(1);

			expect(deleteMock).toHaveBeenCalledWith({ where: { id: 1 } });
		});
	});
});
