import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/prisma";

const hasRequiredEnv = !!process.env.DATABASE_URL;
const describeIfEnv = hasRequiredEnv ? describe : describe.skip;

describeIfEnv("questionnaire schema integration", () => {
	let institutionId: number;

	beforeAll(async () => {
		const institution = await prisma.institution.create({
			data: { name: `Questionnaire Schema Test Institution ${Date.now()}` },
		});
		institutionId = institution.id;
	});

	afterAll(async () => {
		await prisma.institution.deleteMany({ where: { id: institutionId } });
	});

	it("creates a questionnaire with a question and an answer, and enforces the (questionnaire_id, key) unique constraint", async () => {
		const questionnaire = await prisma.questionnaire.create({
			data: { title: "Test Questionnaire", status: "open" },
		});

		try {
			const question = await prisma.question.create({
				data: {
					questionnaire_id: questionnaire.id,
					key: "stability",
					label: "Wie stabil ist Ihre Trägerstruktur?",
					field_type: "likert",
					required: true,
					config: {
						options: [
							{ value: "1", label: "sehr instabil" },
							{ value: "5", label: "sehr stabil" },
						],
					},
				},
			});

			const answer = await prisma.answer.create({
				data: {
					questionnaire_id: questionnaire.id,
					question_id: question.id,
					institution_id: institutionId,
					value: "5",
				},
			});

			expect(answer.value).toBe("5");

			await expect(
				prisma.question.create({
					data: {
						questionnaire_id: questionnaire.id,
						key: "stability",
						label: "Duplicate key",
						field_type: "text",
					},
				}),
			).rejects.toThrow();
		} finally {
			await prisma.questionnaire.delete({ where: { id: questionnaire.id } });
		}
	});

	it("cascades deletes from Questionnaire to Question and Answer", async () => {
		const questionnaire = await prisma.questionnaire.create({
			data: { title: "Cascade Test Questionnaire" },
		});
		const question = await prisma.question.create({
			data: {
				questionnaire_id: questionnaire.id,
				key: "q1",
				label: "Question 1",
				field_type: "text",
			},
		});
		await prisma.answer.create({
			data: {
				questionnaire_id: questionnaire.id,
				question_id: question.id,
				institution_id: institutionId,
				value: "hello",
			},
		});

		await prisma.questionnaire.delete({ where: { id: questionnaire.id } });

		expect(
			await prisma.question.findUnique({ where: { id: question.id } }),
		).toBeNull();
		expect(
			await prisma.answer.findFirst({ where: { question_id: question.id } }),
		).toBeNull();
	});

	it("cascades deletes from Institution to Answer and supports guest submitter fields", async () => {
		const institution = await prisma.institution.create({
			data: { name: `Cascade Institution ${Date.now()}` },
		});
		const questionnaire = await prisma.questionnaire.create({
			data: { title: "Institution Cascade Questionnaire" },
		});

		try {
			const question = await prisma.question.create({
				data: {
					questionnaire_id: questionnaire.id,
					key: "q1",
					label: "Question 1",
					field_type: "text",
				},
			});
			const answer = await prisma.answer.create({
				data: {
					questionnaire_id: questionnaire.id,
					question_id: question.id,
					institution_id: institution.id,
					value: "hi",
					submitter_name: "Guest Submitter",
					submitter_email: "guest@example.test",
				},
			});
			expect(answer.created_by).toBeNull();

			await prisma.institution.delete({ where: { id: institution.id } });

			expect(
				await prisma.answer.findUnique({ where: { id: answer.id } }),
			).toBeNull();
		} finally {
			await prisma.questionnaire.delete({ where: { id: questionnaire.id } });
		}
	});

	it("allows multiple historical answers for the same question without a unique constraint", async () => {
		const questionnaire = await prisma.questionnaire.create({
			data: { title: "History Test Questionnaire" },
		});

		try {
			const question = await prisma.question.create({
				data: {
					questionnaire_id: questionnaire.id,
					key: "q1",
					label: "Question 1",
					field_type: "text",
				},
			});

			await prisma.answer.create({
				data: {
					questionnaire_id: questionnaire.id,
					question_id: question.id,
					institution_id: institutionId,
					value: "first",
				},
			});
			await prisma.answer.create({
				data: {
					questionnaire_id: questionnaire.id,
					question_id: question.id,
					institution_id: institutionId,
					value: "second",
				},
			});

			const answers = await prisma.answer.findMany({
				where: { question_id: question.id },
				orderBy: { created_at: "asc" },
			});
			expect(answers).toHaveLength(2);
			expect(answers.map((a) => a.value)).toEqual(["first", "second"]);
		} finally {
			await prisma.questionnaire.delete({ where: { id: questionnaire.id } });
		}
	});
});
