import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	listOpenMock,
	findByIdMock,
	createManyMock,
	hasAnsweredMock,
	relinkMock,
	listBySubmissionMock,
	listLatestByQuestionnaireAndInstitutionMock,
	listLatestByQuestionnaireAllInstitutionsMock,
	listByQuestionnaireMock,
	getCurrentUserIdMock,
	getAccessContextForUserMock,
	authorizeTableMock,
	loggerWarn,
	loggerError,
	prismaTransactionMock,
	txSubmissionCreateMock,
	txAnswerCreateManyMock,
	createSubmissionMock,
	validateSubmissionCreateInputMock,
	normalizeSubmissionJsonMock,
	questionnaireFindUniqueMock,
	entityAuditCreateMock,
	institutionFindUniqueMock,
	submissionFindUniqueMock,
} = vi.hoisted(() => ({
	listOpenMock: vi.fn(),
	findByIdMock: vi.fn(),
	createManyMock: vi.fn(),
	hasAnsweredMock: vi.fn(),
	relinkMock: vi.fn(),
	listBySubmissionMock: vi.fn(),
	listLatestByQuestionnaireAndInstitutionMock: vi.fn(),
	listLatestByQuestionnaireAllInstitutionsMock: vi.fn(),
	listByQuestionnaireMock: vi.fn(),
	getCurrentUserIdMock: vi.fn(),
	getAccessContextForUserMock: vi.fn(),
	authorizeTableMock: vi.fn(),
	loggerWarn: vi.fn(),
	loggerError: vi.fn(),
	prismaTransactionMock: vi.fn(),
	txSubmissionCreateMock: vi.fn(),
	txAnswerCreateManyMock: vi.fn(),
	createSubmissionMock: vi.fn(),
	validateSubmissionCreateInputMock: vi.fn((input: unknown) => input),
	normalizeSubmissionJsonMock: vi.fn((value: unknown) => value),
	questionnaireFindUniqueMock: vi.fn(),
	entityAuditCreateMock: vi.fn(),
	institutionFindUniqueMock: vi.fn(),
	submissionFindUniqueMock: vi.fn(),
}));

vi.mock("@/server/data/questionnaireRepo", () => ({
	questionnaireRepo: {
		listOpen: listOpenMock,
		findById: findByIdMock,
	},
}));

vi.mock("@/server/data/questionRepo", () => ({
	questionRepo: {
		listByQuestionnaire: listByQuestionnaireMock,
	},
}));

vi.mock("@/server/data/answerRepo", () => ({
	answerRepo: {
		createMany: createManyMock,
		hasAnswered: hasAnsweredMock,
		relink: relinkMock,
		listBySubmission: listBySubmissionMock,
		listLatestByQuestionnaireAndInstitution:
			listLatestByQuestionnaireAndInstitutionMock,
		listLatestByQuestionnaireAllInstitutions:
			listLatestByQuestionnaireAllInstitutionsMock,
	},
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/server/actions/submissions", () => ({
	createSubmission: createSubmissionMock,
}));

vi.mock("@/server/prisma", () => ({
	prisma: {
		$transaction: (...args: unknown[]) => prismaTransactionMock(...args),
		questionnaire: {
			findUnique: (...args: unknown[]) => questionnaireFindUniqueMock(...args),
		},
		entityAudit: {
			create: (...args: unknown[]) => entityAuditCreateMock(...args),
		},
		institution: {
			findUnique: (...args: unknown[]) => institutionFindUniqueMock(...args),
		},
		submission: {
			findUnique: (...args: unknown[]) => submissionFindUniqueMock(...args),
		},
	},
}));

vi.mock("@/server/validation/submissions", () => ({
	validateSubmissionCreateInput: validateSubmissionCreateInputMock,
}));

vi.mock("@/lib/utils/submissionJsonUtils", () => ({
	normalizeSubmissionJson: normalizeSubmissionJsonMock,
}));

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: getAccessContextForUserMock,
	authorizeTable: authorizeTableMock,
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		warn: loggerWarn,
		error: loggerError,
	},
}));

import {
	checkQuestionnaireCompletion,
	downloadAllQuestionnaireAnswers,
	downloadQuestionnaireAnswers,
	getLinkedQuestionnaireAnswersCount,
	getOpenQuestionnaire,
	relinkQuestionnaireAnswers,
	submitQuestionnaireAnswers,
} from "@/server/actions/questionnaires";

describe("server actions: questionnaires", () => {
	beforeEach(() => {
		listOpenMock.mockReset();
		findByIdMock.mockReset();
		createManyMock.mockReset();
		hasAnsweredMock.mockReset();
		hasAnsweredMock.mockResolvedValue(false);
		relinkMock.mockReset();
		listBySubmissionMock.mockReset();
		listLatestByQuestionnaireAndInstitutionMock.mockReset();
		listLatestByQuestionnaireAllInstitutionsMock.mockReset();
		listByQuestionnaireMock.mockReset();
		getCurrentUserIdMock.mockReset();
		getAccessContextForUserMock.mockReset();
		getAccessContextForUserMock.mockResolvedValue({ role: "admin" });
		authorizeTableMock.mockReset();
		loggerWarn.mockReset();
		loggerError.mockReset();

		prismaTransactionMock.mockReset();
		txSubmissionCreateMock.mockReset();
		txAnswerCreateManyMock.mockReset();
		createSubmissionMock.mockReset();
		validateSubmissionCreateInputMock.mockClear();
		validateSubmissionCreateInputMock.mockImplementation(
			(input: unknown) => input,
		);
		normalizeSubmissionJsonMock.mockClear();
		normalizeSubmissionJsonMock.mockImplementation((value: unknown) => value);

		prismaTransactionMock.mockImplementation(
			async (
				callback: (tx: {
					submission: { create: typeof txSubmissionCreateMock };
					answer: { createMany: typeof txAnswerCreateManyMock };
				}) => unknown,
			) =>
				callback({
					submission: { create: txSubmissionCreateMock },
					answer: { createMany: txAnswerCreateManyMock },
				}),
		);
		txSubmissionCreateMock.mockResolvedValue({ id: 99 });
		txAnswerCreateManyMock.mockResolvedValue({ count: 1 });

		questionnaireFindUniqueMock.mockReset();
		questionnaireFindUniqueMock.mockResolvedValue({ title: "Test Survey" });
		entityAuditCreateMock.mockReset();
		entityAuditCreateMock.mockResolvedValue({ id: 1 });
		institutionFindUniqueMock.mockReset();
		institutionFindUniqueMock.mockResolvedValue({ name: "Café Sibylle" });
		submissionFindUniqueMock.mockReset();
		submissionFindUniqueMock.mockResolvedValue({
			data: { name: "Pending Place" },
		});
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
					submission_id: undefined,
					value: "yes",
					created_by: "user-1",
					submitter_name: undefined,
					submitter_email: undefined,
				},
				{
					questionnaire_id: 1,
					question_id: 11,
					institution_id: 2,
					submission_id: undefined,
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
					submission_id: undefined,
					value: "yes",
					created_by: null,
					submitter_name: "Jane Doe",
					submitter_email: "jane@example.test",
				},
			]);
		});

		it("stores submission_id instead of institution_id when submitting for a pending submission", async () => {
			getCurrentUserIdMock.mockResolvedValue(null);
			createManyMock.mockResolvedValue({ count: 1 });

			await expect(
				submitQuestionnaireAnswers({
					questionnaireId: 1,
					submissionId: 7,
					answers: [{ questionId: 10, value: "yes" }],
				}),
			).resolves.toEqual({ ok: true });

			expect(createManyMock).toHaveBeenCalledWith([
				expect.objectContaining({
					institution_id: undefined,
					submission_id: 7,
				}),
			]);
		});

		it("rejects when neither institutionId nor submissionId is given", async () => {
			await expect(
				submitQuestionnaireAnswers({
					questionnaireId: 1,
					answers: [{ questionId: 10, value: "yes" }],
				}),
			).resolves.toEqual({ ok: false, error: "invalid_target" });
			expect(createManyMock).not.toHaveBeenCalled();
		});

		it("rejects when both institutionId and submissionId are given", async () => {
			await expect(
				submitQuestionnaireAnswers({
					questionnaireId: 1,
					institutionId: 2,
					submissionId: 7,
					answers: [{ questionId: 10, value: "yes" }],
				}),
			).resolves.toEqual({ ok: false, error: "invalid_target" });
			expect(createManyMock).not.toHaveBeenCalled();
		});

		it("returns already_submitted without inserting when the entity already completed it", async () => {
			hasAnsweredMock.mockResolvedValue(true);

			await expect(submitQuestionnaireAnswers(baseParams)).resolves.toEqual({
				ok: false,
				error: "already_submitted",
			});
			expect(createManyMock).not.toHaveBeenCalled();
		});

		it("returns unexpected on repo failure", async () => {
			getCurrentUserIdMock.mockResolvedValue(null);
			createManyMock.mockRejectedValue(new Error("db down"));

			await expect(submitQuestionnaireAnswers(baseParams)).resolves.toEqual({
				ok: false,
				error: "unexpected",
			});
			expect(loggerError).toHaveBeenCalled();
		});

		it("logs a questionnaire-completion audit entry with the institution's name after the answers are saved", async () => {
			getCurrentUserIdMock.mockResolvedValue("user-1");
			createManyMock.mockResolvedValue({ count: 2 });

			await submitQuestionnaireAnswers(baseParams);

			expect(questionnaireFindUniqueMock).toHaveBeenCalledWith({
				where: { id: 1 },
				select: { title: true },
			});
			expect(institutionFindUniqueMock).toHaveBeenCalledWith({
				where: { id: 2 },
				select: { name: true },
			});
			expect(submissionFindUniqueMock).not.toHaveBeenCalled();
			expect(entityAuditCreateMock).toHaveBeenCalledWith({
				data: {
					entity_id: "1",
					entity_type: "questionnaire",
					action: "create",
					status: "completed",
					changed_by: "user-1",
					new_data: {
						questionnaireId: 1,
						questionnaireTitle: "Test Survey",
						entityName: "Café Sibylle",
						institutionId: 2,
						submissionId: null,
						answerCount: 2,
					},
					meta_info: {
						intent: "questionnaire_submitted",
						submitter_name: null,
						submitter_email: null,
					},
				},
			});
		});

		it("looks up the pending submission's name instead of an institution's when answering for a submission", async () => {
			getCurrentUserIdMock.mockResolvedValue(null);
			createManyMock.mockResolvedValue({ count: 1 });

			await submitQuestionnaireAnswers({
				questionnaireId: 1,
				submissionId: 7,
				answers: [{ questionId: 10, value: "yes" }],
			});

			expect(submissionFindUniqueMock).toHaveBeenCalledWith({
				where: { id: 7 },
				select: { data: true },
			});
			expect(institutionFindUniqueMock).not.toHaveBeenCalled();
			expect(entityAuditCreateMock).toHaveBeenCalledWith({
				data: expect.objectContaining({
					new_data: expect.objectContaining({
						entityName: "Pending Place",
						submissionId: 7,
					}),
				}),
			});
		});

		it("does not fail the submission when the completion-audit write itself fails", async () => {
			getCurrentUserIdMock.mockResolvedValue("user-1");
			createManyMock.mockResolvedValue({ count: 2 });
			entityAuditCreateMock.mockRejectedValue(new Error("audit db down"));

			await expect(submitQuestionnaireAnswers(baseParams)).resolves.toEqual({
				ok: true,
			});
			expect(loggerError).toHaveBeenCalledWith(
				"questionnaire.completion_audit.failed",
				expect.any(Error),
				expect.objectContaining({ questionnaire_id: 1 }),
			);
		});

		it("rejects when newInstitution is given together with institutionId", async () => {
			await expect(
				submitQuestionnaireAnswers({
					questionnaireId: 1,
					institutionId: 2,
					newInstitution: {
						name: "New Place",
						address: {},
						categoryIds: [],
						newCategoryKeys: [],
					},
					answers: [{ questionId: 10, value: "yes" }],
				}),
			).resolves.toEqual({ ok: false, error: "invalid_target" });
			expect(prismaTransactionMock).not.toHaveBeenCalled();
		});

		describe("with newInstitution", () => {
			const newInstitutionParams = {
				questionnaireId: 1,
				newInstitution: {
					name: "New Place",
					address: { city: "Berlin" },
					categoryIds: [5, 6],
					established_since: "2020-01-01",
					newCategoryKeys: ["Archiv", "Werkstatt"],
				},
				answers: [
					{ questionId: 10, value: "yes" },
					{ questionId: 11, value: 5 },
				],
			};

			it("creates the submission and answers atomically, then best-effort category submissions", async () => {
				getCurrentUserIdMock.mockResolvedValue("user-1");
				createSubmissionMock.mockResolvedValue({ id: 123 });

				await expect(
					submitQuestionnaireAnswers(newInstitutionParams),
				).resolves.toEqual({ ok: true });

				expect(getAccessContextForUserMock).toHaveBeenCalledWith("user-1");
				expect(authorizeTableMock).toHaveBeenCalledWith(
					{ role: "admin" },
					"submission",
					"create",
				);
				expect(txSubmissionCreateMock).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.objectContaining({
							entity_type: "institution",
							type: "create",
							status: "approval_pending",
							data: expect.objectContaining({
								name: "New Place",
								address: { city: "Berlin" },
								categoryIds: [5, 6],
							}),
							creator: { connect: { id: "user-1" } },
						}),
					}),
				);
				expect(txAnswerCreateManyMock).toHaveBeenCalledWith({
					data: [
						expect.objectContaining({
							questionnaire_id: 1,
							question_id: 10,
							submission_id: 99,
							value: "yes",
							created_by: "user-1",
						}),
						expect.objectContaining({
							questionnaire_id: 1,
							question_id: 11,
							submission_id: 99,
							value: 5,
							created_by: "user-1",
						}),
					],
				});
				// hasAnswered is skipped entirely — a submission that doesn't exist
				// yet cannot already have answers.
				expect(hasAnsweredMock).not.toHaveBeenCalled();

				expect(createSubmissionMock).toHaveBeenCalledWith(
					expect.objectContaining({
						entityType: "category",
						type: "create",
						data: { key: "Archiv" },
						meta: {
							source: "questionnaire",
							institutionSubmissionId: 99,
						},
					}),
				);
				expect(createSubmissionMock).toHaveBeenCalledWith(
					expect.objectContaining({
						entityType: "category",
						data: { key: "Werkstatt" },
					}),
				);
			});

			it("logs a questionnaire-completion audit entry using the newly created submission's id and the name already in hand (no extra lookup)", async () => {
				getCurrentUserIdMock.mockResolvedValue("user-1");
				createSubmissionMock.mockResolvedValue({ id: 123 });

				await submitQuestionnaireAnswers(newInstitutionParams);

				expect(entityAuditCreateMock).toHaveBeenCalledWith({
					data: expect.objectContaining({
						entity_id: "1",
						entity_type: "questionnaire",
						new_data: expect.objectContaining({
							entityName: "New Place",
							institutionId: null,
							submissionId: 99,
							answerCount: 2,
						}),
					}),
				});
				expect(institutionFindUniqueMock).not.toHaveBeenCalled();
				expect(submissionFindUniqueMock).not.toHaveBeenCalled();
			});

			it("skips category submissions when none were suggested", async () => {
				await submitQuestionnaireAnswers({
					...newInstitutionParams,
					newInstitution: {
						...newInstitutionParams.newInstitution,
						newCategoryKeys: [],
					},
				});

				expect(createSubmissionMock).not.toHaveBeenCalled();
			});

			it("returns unexpected and never creates category submissions if the transaction fails (rollback)", async () => {
				prismaTransactionMock.mockRejectedValue(new Error("db down"));

				await expect(
					submitQuestionnaireAnswers(newInstitutionParams),
				).resolves.toEqual({ ok: false, error: "unexpected" });

				expect(createSubmissionMock).not.toHaveBeenCalled();
				expect(loggerError).toHaveBeenCalled();
			});

			it("returns unexpected when not authorized to create a submission", async () => {
				authorizeTableMock.mockImplementation(() => {
					throw new Error("Role lacks create on submission");
				});

				await expect(
					submitQuestionnaireAnswers(newInstitutionParams),
				).resolves.toEqual({ ok: false, error: "unexpected" });

				expect(prismaTransactionMock).not.toHaveBeenCalled();
				expect(createSubmissionMock).not.toHaveBeenCalled();
			});
		});
	});

	describe("checkQuestionnaireCompletion", () => {
		it("returns alreadySubmitted from the repo", async () => {
			hasAnsweredMock.mockResolvedValue(true);

			await expect(
				checkQuestionnaireCompletion({ questionnaireId: 1, institutionId: 2 }),
			).resolves.toEqual({ ok: true, alreadySubmitted: true });
			expect(hasAnsweredMock).toHaveBeenCalledWith({
				questionnaireId: 1,
				institutionId: 2,
			});
		});

		it("returns unexpected on repo failure", async () => {
			hasAnsweredMock.mockRejectedValue(new Error("db down"));

			await expect(
				checkQuestionnaireCompletion({ questionnaireId: 1, institutionId: 2 }),
			).resolves.toEqual({ ok: false, error: "unexpected" });
			expect(loggerError).toHaveBeenCalled();
		});
	});

	describe("relinkQuestionnaireAnswers", () => {
		it("relinks answers to an institution after authorizing the admin", async () => {
			relinkMock.mockResolvedValue({ count: 3 });

			await expect(
				relinkQuestionnaireAnswers({
					fromSubmissionId: 9,
					toInstitutionId: 42,
				}),
			).resolves.toEqual({ ok: true, count: 3 });

			expect(authorizeTableMock).toHaveBeenCalledWith(
				{ role: "admin" },
				"submission",
				"update",
			);
			expect(relinkMock).toHaveBeenCalledWith({
				fromSubmissionId: 9,
				toInstitutionId: 42,
			});
		});

		it("relinks answers to a different submission", async () => {
			relinkMock.mockResolvedValue({ count: 1 });

			await expect(
				relinkQuestionnaireAnswers({ fromSubmissionId: 9, toSubmissionId: 11 }),
			).resolves.toEqual({ ok: true, count: 1 });
			expect(relinkMock).toHaveBeenCalledWith({
				fromSubmissionId: 9,
				toSubmissionId: 11,
			});
		});

		it("rejects when neither toInstitutionId nor toSubmissionId is given", async () => {
			await expect(
				relinkQuestionnaireAnswers({ fromSubmissionId: 9 }),
			).resolves.toEqual({ ok: false, error: "invalid_target" });
			expect(relinkMock).not.toHaveBeenCalled();
		});

		it("rejects when both toInstitutionId and toSubmissionId are given", async () => {
			await expect(
				relinkQuestionnaireAnswers({
					fromSubmissionId: 9,
					toInstitutionId: 42,
					toSubmissionId: 11,
				}),
			).resolves.toEqual({ ok: false, error: "invalid_target" });
			expect(relinkMock).not.toHaveBeenCalled();
		});

		it("returns unexpected when the user isn't authorized", async () => {
			authorizeTableMock.mockImplementation(() => {
				throw new Error("Role lacks update on submission");
			});

			await expect(
				relinkQuestionnaireAnswers({
					fromSubmissionId: 9,
					toInstitutionId: 42,
				}),
			).resolves.toEqual({ ok: false, error: "unexpected" });
			expect(relinkMock).not.toHaveBeenCalled();
			expect(loggerError).toHaveBeenCalled();
		});

		it("returns unexpected on repo failure", async () => {
			relinkMock.mockRejectedValue(new Error("db down"));

			await expect(
				relinkQuestionnaireAnswers({
					fromSubmissionId: 9,
					toInstitutionId: 42,
				}),
			).resolves.toEqual({ ok: false, error: "unexpected" });
			expect(loggerError).toHaveBeenCalled();
		});
	});

	describe("getLinkedQuestionnaireAnswersCount", () => {
		it("returns the number of answers linked to a submission after authorizing", async () => {
			listBySubmissionMock.mockResolvedValue([{ id: 1 }, { id: 2 }]);

			await expect(getLinkedQuestionnaireAnswersCount(9)).resolves.toEqual({
				ok: true,
				count: 2,
			});
			expect(authorizeTableMock).toHaveBeenCalledWith(
				{ role: "admin" },
				"submission",
				"update",
			);
			expect(listBySubmissionMock).toHaveBeenCalledWith(9);
		});

		it("returns unexpected when the user isn't authorized", async () => {
			authorizeTableMock.mockImplementation(() => {
				throw new Error("Role lacks update on submission");
			});

			await expect(getLinkedQuestionnaireAnswersCount(9)).resolves.toEqual({
				ok: false,
				error: "unexpected",
			});
			expect(listBySubmissionMock).not.toHaveBeenCalled();
		});

		it("returns unexpected on repo failure", async () => {
			listBySubmissionMock.mockRejectedValue(new Error("db down"));

			await expect(getLinkedQuestionnaireAnswersCount(9)).resolves.toEqual({
				ok: false,
				error: "unexpected",
			});
			expect(loggerError).toHaveBeenCalled();
		});
	});

	describe("downloadQuestionnaireAnswers", () => {
		it("returns the mapped rows for the institution's latest answers, sorted by step/order", async () => {
			const metaData = { blocks: { "1": { title: "Block A: Test" } } };
			listOpenMock.mockResolvedValue([{ id: 1, meta_data: metaData }]);
			const answeredAt = new Date("2026-01-01T00:00:00.000Z");
			listLatestByQuestionnaireAndInstitutionMock.mockResolvedValue([
				{
					question: {
						label: "Wie viele Mitarbeitende?",
						step: 2,
						order: 0,
						field_type: "text",
						config: null,
					},
					value: "5",
					submitter_name: "Jane Doe",
					submitter_email: "jane@example.test",
					created_at: answeredAt,
				},
				{
					question: {
						label: "Wie hoch ist die Miete?",
						step: 1,
						order: 0,
						field_type: "text",
						config: null,
					},
					value: "1200",
					submitter_name: "Jane Doe",
					submitter_email: "jane@example.test",
					created_at: answeredAt,
				},
			]);

			await expect(downloadQuestionnaireAnswers(2)).resolves.toEqual({
				ok: true,
				data: {
					institutionName: "",
					metaData,
					rows: [
						{
							questionLabel: "Wie hoch ist die Miete?",
							step: 1,
							fieldType: "text",
							config: null,
							value: "1200",
							submitterName: "Jane Doe",
							submitterEmail: "jane@example.test",
							answeredAt,
						},
						{
							questionLabel: "Wie viele Mitarbeitende?",
							step: 2,
							fieldType: "text",
							config: null,
							value: "5",
							submitterName: "Jane Doe",
							submitterEmail: "jane@example.test",
							answeredAt,
						},
					],
				},
			});
			expect(listLatestByQuestionnaireAndInstitutionMock).toHaveBeenCalledWith(
				1,
				2,
			);
		});

		it("returns noOpenQuestionnaireAnswers when no questionnaire is open", async () => {
			listOpenMock.mockResolvedValue([]);

			await expect(downloadQuestionnaireAnswers(2)).resolves.toEqual({
				ok: false,
				error: "noOpenQuestionnaireAnswers",
			});
			expect(
				listLatestByQuestionnaireAndInstitutionMock,
			).not.toHaveBeenCalled();
		});

		it("returns noAnswers when the institution hasn't answered", async () => {
			listOpenMock.mockResolvedValue([{ id: 1 }]);
			listLatestByQuestionnaireAndInstitutionMock.mockResolvedValue([]);

			await expect(downloadQuestionnaireAnswers(2)).resolves.toEqual({
				ok: false,
				error: "noAnswers",
			});
		});

		it("returns forbidden when the user isn't authorized", async () => {
			authorizeTableMock.mockImplementation(() => {
				const error = new Error("Role lacks read on answer");
				error.name = "RBACError";
				throw error;
			});

			await expect(downloadQuestionnaireAnswers(2)).resolves.toEqual({
				ok: false,
				error: "forbidden",
			});
			expect(listOpenMock).not.toHaveBeenCalled();
		});

		it("returns unexpected on repo failure", async () => {
			listOpenMock.mockResolvedValue([{ id: 1 }]);
			listLatestByQuestionnaireAndInstitutionMock.mockRejectedValue(
				new Error("db down"),
			);

			await expect(downloadQuestionnaireAnswers(2)).resolves.toEqual({
				ok: false,
				error: "unexpected",
			});
			expect(loggerError).toHaveBeenCalled();
		});
	});

	describe("downloadAllQuestionnaireAnswers", () => {
		it("groups the latest answers by institution and sorts institutions by name", async () => {
			const metaData = { blocks: { "1": { title: "Block A: Test" } } };
			listOpenMock.mockResolvedValue([{ id: 1, meta_data: metaData }]);
			listByQuestionnaireMock.mockResolvedValue([
				{
					id: 10,
					label: "Wie hoch ist die Miete?",
					step: 1,
					field_type: "text",
					config: null,
				},
				{
					id: 11,
					label: "Wie viele Mitarbeitende?",
					step: 1,
					field_type: "text",
					config: null,
				},
			]);
			const olderAnswer = new Date("2026-01-01T00:00:00.000Z");
			const newerAnswer = new Date("2026-01-02T00:00:00.000Z");
			listLatestByQuestionnaireAllInstitutionsMock.mockResolvedValue([
				{
					institution: { id: 2, name: "Zebra Kulturhaus" },
					question_id: 10,
					value: "1200",
					created_at: olderAnswer,
				},
				{
					institution: { id: 2, name: "Zebra Kulturhaus" },
					question_id: 11,
					value: "5",
					created_at: newerAnswer,
				},
				{
					institution: { id: 3, name: "Atelier Anders" },
					question_id: 10,
					value: "900",
					created_at: olderAnswer,
				},
			]);

			await expect(downloadAllQuestionnaireAnswers()).resolves.toEqual({
				ok: true,
				data: {
					metaData,
					questions: [
						{
							id: 10,
							label: "Wie hoch ist die Miete?",
							step: 1,
							fieldType: "text",
							config: null,
						},
						{
							id: 11,
							label: "Wie viele Mitarbeitende?",
							step: 1,
							fieldType: "text",
							config: null,
						},
					],
					institutions: [
						{
							id: 3,
							name: "Atelier Anders",
							answeredAt: olderAnswer,
							answers: { 10: "900" },
						},
						{
							id: 2,
							name: "Zebra Kulturhaus",
							// answeredAt tracks the latest of this institution's own
							// answers, not a global latest — must stay newerAnswer.
							answeredAt: newerAnswer,
							answers: { 10: "1200", 11: "5" },
						},
					],
				},
			});
		});

		it("skips answers that are only linked to a pending submission, not an institution", async () => {
			listOpenMock.mockResolvedValue([{ id: 1 }]);
			listByQuestionnaireMock.mockResolvedValue([
				{ id: 10, label: "Wie hoch ist die Miete?" },
			]);
			listLatestByQuestionnaireAllInstitutionsMock.mockResolvedValue([
				{
					institution: null,
					question_id: 10,
					value: "should be excluded",
					created_at: new Date(),
				},
				{
					institution: { id: 2, name: "Zebra Kulturhaus" },
					question_id: 10,
					value: "1200",
					created_at: new Date(),
				},
			]);

			const result = await downloadAllQuestionnaireAnswers();

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data.institutions).toHaveLength(1);
				expect(result.data.institutions[0].id).toBe(2);
			}
		});

		it("returns noOpenQuestionnaireAnswers when no questionnaire is open", async () => {
			listOpenMock.mockResolvedValue([]);

			await expect(downloadAllQuestionnaireAnswers()).resolves.toEqual({
				ok: false,
				error: "noOpenQuestionnaireAnswers",
			});
			expect(listByQuestionnaireMock).not.toHaveBeenCalled();
		});

		it("returns noAnswers when nobody has answered yet", async () => {
			listOpenMock.mockResolvedValue([{ id: 1 }]);
			listByQuestionnaireMock.mockResolvedValue([]);
			listLatestByQuestionnaireAllInstitutionsMock.mockResolvedValue([]);

			await expect(downloadAllQuestionnaireAnswers()).resolves.toEqual({
				ok: false,
				error: "noAnswers",
			});
		});

		it("returns forbidden when the user isn't authorized", async () => {
			authorizeTableMock.mockImplementation(() => {
				const error = new Error("Role lacks read on answer");
				error.name = "RBACError";
				throw error;
			});

			await expect(downloadAllQuestionnaireAnswers()).resolves.toEqual({
				ok: false,
				error: "forbidden",
			});
			expect(listOpenMock).not.toHaveBeenCalled();
		});

		it("returns unexpected on repo failure", async () => {
			listOpenMock.mockResolvedValue([{ id: 1 }]);
			listByQuestionnaireMock.mockResolvedValue([]);
			listLatestByQuestionnaireAllInstitutionsMock.mockRejectedValue(
				new Error("db down"),
			);

			await expect(downloadAllQuestionnaireAnswers()).resolves.toEqual({
				ok: false,
				error: "unexpected",
			});
			expect(loggerError).toHaveBeenCalled();
		});
	});
});
