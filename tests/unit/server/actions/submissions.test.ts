import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createSubmission,
	reviewSubmission,
	saveSubmissionNote,
	updateSubmission,
} from "@/server/actions/submissions";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import { getCurrentUserId } from "@/server/actions/auth";

vi.mock("@/server/actions/auth", () => ({
	getCurrentUserId: vi.fn().mockResolvedValue("user-1"),
}));

vi.mock("@/server/utils/actionsUtils", () => ({
	revalidateAccount: vi.fn(),
}));

const getTableScopeMock = vi.fn();
const requireScopeOrUserMock = vi.fn();
const canFieldsMock = vi.fn();

vi.mock("@/server/utils/rbac", () => ({
	getAccessContextForUser: vi.fn().mockResolvedValue({
		field: {
			submission: {
				name: new Set(["read"]),
			},
		},
	}),
	authorizeTable: vi.fn(),
	canFields: (...args: unknown[]) => canFieldsMock(...args),
	getTableScope: () => getTableScopeMock(),
	requireAllScope: vi.fn(),
	requireScopeOrUser: (...args: unknown[]) => requireScopeOrUserMock(...args),
}));

const {
	prismaTransactionMock,
	prismaInstitutionFindFirstMock,
	prismaInstitutionFindUniqueMock,
	prismaUserFindUniqueMock,
	txInstitutionCreateMock,
	txInstitutionUpdateMock,
	txInstitutionFindFirstMock,
	txSubmissionDeleteMock,
	txSubmissionUpdateMock,
	txSubmissionNoteCreateMock,
	txInstitutionDeleteMock,
} = vi.hoisted(() => ({
	prismaTransactionMock: vi.fn(),
	prismaInstitutionFindFirstMock: vi.fn(),
	prismaInstitutionFindUniqueMock: vi.fn(),
	prismaUserFindUniqueMock: vi.fn(),
	txInstitutionCreateMock: vi.fn(),
	txInstitutionUpdateMock: vi.fn(),
	txInstitutionFindFirstMock: vi.fn(),
	txSubmissionDeleteMock: vi.fn(),
	txSubmissionUpdateMock: vi.fn(),
	txSubmissionNoteCreateMock: vi.fn(),
	txInstitutionDeleteMock: vi.fn(),
}));

vi.mock("@/server/prisma", () => ({
	prisma: {
		$transaction: (...args: unknown[]) => prismaTransactionMock(...args),
		institution: {
			findFirst: (...args: unknown[]) =>
				prismaInstitutionFindFirstMock(...args),
			findUnique: (...args: unknown[]) =>
				prismaInstitutionFindUniqueMock(...args),
		},
		user: {
			findUnique: (...args: unknown[]) => prismaUserFindUniqueMock(...args),
		},
	},
}));

vi.mock("@/server/logic/submissionAudit", () => ({
	updateSubmissionAuditStatus: vi.fn(),
}));

vi.mock("@/server/email/dispatcher", () => ({
	sendClaimDecisionEmail: vi.fn(),
	sendSubmissionDecisionEmail: vi.fn(),
}));

const buildInstitutionScopedWhereMock = vi.fn();

vi.mock("@/server/logic/institutionAccess", () => ({
	buildInstitutionScopedWhere: (...args: unknown[]) =>
		buildInstitutionScopedWhereMock(...args),
}));

const updateWhereMock = vi.fn();
const createMock = vi.fn();
const createNoteMock = vi.fn();
const findByIdMock = vi.fn();
const findFirstMock = vi.fn();

vi.mock("@/server/data/submissionRepo", () => ({
	submissionRepo: {
		updateWhere: (where: unknown, data: unknown) =>
			updateWhereMock(where, data),
		create: (data: unknown) => createMock(data),
		createNote: (data: unknown) => createNoteMock(data),
		findById: (id: number) => findByIdMock(id),
		findFirst: (where: unknown) => findFirstMock(where),
	},
}));

describe("server actions: submissions", () => {
	beforeEach(() => {
		getTableScopeMock.mockReset();
		requireScopeOrUserMock.mockReset();
		canFieldsMock.mockReset();
		updateWhereMock.mockReset();
		createMock.mockReset();
		createNoteMock.mockReset();
		findByIdMock.mockReset();
		findFirstMock.mockReset();
		prismaTransactionMock.mockReset();
		prismaInstitutionFindFirstMock.mockReset();
		prismaInstitutionFindUniqueMock.mockReset();
		prismaUserFindUniqueMock.mockReset();
		txInstitutionCreateMock.mockReset();
		txInstitutionUpdateMock.mockReset();
		txInstitutionFindFirstMock.mockReset();
		txSubmissionDeleteMock.mockReset();
		txSubmissionUpdateMock.mockReset();
		txSubmissionNoteCreateMock.mockReset();
		txInstitutionDeleteMock.mockReset();
		buildInstitutionScopedWhereMock.mockReset();
		canFieldsMock.mockReturnValue(true);
		buildInstitutionScopedWhereMock.mockImplementation(
			(_scope, _userId, where) => where,
		);
		prismaTransactionMock.mockImplementation(async (callback: unknown) =>
			(callback as (tx: unknown) => Promise<unknown>)({
				institution: {
					create: txInstitutionCreateMock,
					update: txInstitutionUpdateMock,
					findFirst: txInstitutionFindFirstMock,
					delete: txInstitutionDeleteMock,
				},
				submission: {
					delete: txSubmissionDeleteMock,
					update: txSubmissionUpdateMock,
				},
				submissionNote: {
					create: txSubmissionNoteCreateMock,
				},
			}),
		);
	});

	it("createSubmission checks pending duplicates only for the current user", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		findFirstMock.mockResolvedValue(null);
		createMock.mockResolvedValue({ id: 99 });

		await createSubmission({
			entityType: SubmissionEntityType.institution,
			entityId: 12,
			type: SubmissionType.update,
			status: "approval_pending",
			data: { name: "A" },
		});

		expect(findFirstMock).toHaveBeenCalledWith(
			expect.objectContaining({
				entity_type: SubmissionEntityType.institution,
				entity_id: 12,
				type: SubmissionType.update,
				status: "approval_pending",
				created_by: "user-1",
			}),
		);
		expect(createMock).toHaveBeenCalled();
	});

	it("createSubmission does not run pending duplicate check for anonymous users", async () => {
		const mockedGetCurrentUserId = vi.mocked(getCurrentUserId);
		mockedGetCurrentUserId.mockResolvedValueOnce(null);
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		createMock.mockResolvedValue({ id: 100 });

		await createSubmission({
			entityType: SubmissionEntityType.institution,
			entityId: 22,
			type: SubmissionType.update,
			status: "approval_pending",
			data: { name: "B" },
		});

		expect(findFirstMock).not.toHaveBeenCalled();
		expect(createMock).toHaveBeenCalledWith(
			expect.objectContaining({
				creator: undefined,
			}),
		);
	});

	it("updateSubmission allows admins to update any submission", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		updateWhereMock.mockResolvedValue({ count: 1 });
		findByIdMock.mockResolvedValue({ id: 1, data: { foo: "bar" } });

		const result = await updateSubmission({ id: 1, data: { foo: "bar" } });

		expect(updateWhereMock).toHaveBeenCalledWith(
			{ id: 1 },
			expect.objectContaining({ data: { foo: "bar" } }),
		);
		expect(result).toEqual({ id: 1, data: { foo: "bar" } });
	});

	it("updateSubmission allows edits on non-draft submissions for own scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		requireScopeOrUserMock.mockReturnValue("user-1");
		findFirstMock.mockResolvedValue({ id: 1, status: "approval_pending" });
		updateWhereMock.mockResolvedValue({ count: 1 });
		findFirstMock.mockResolvedValueOnce({ id: 1, status: "approval_pending" });
		findFirstMock.mockResolvedValueOnce({ id: 1, data: { foo: "bar" } });

		const result = await updateSubmission({ id: 1, data: { foo: "bar" } });
		expect(updateWhereMock).toHaveBeenCalledWith(
			{ id: 1, created_by: "user-1" },
			expect.objectContaining({ data: { foo: "bar" } }),
		);
		expect(result).toEqual({ id: 1, data: { foo: "bar" } });
	});

	it("updateSubmission updates draft submissions for own scope", async () => {
		getTableScopeMock.mockReturnValue("own");
		requireScopeOrUserMock.mockReturnValue("user-1");
		findFirstMock.mockResolvedValueOnce({ id: 1, status: "draft" });
		updateWhereMock.mockResolvedValue({ count: 1 });
		findFirstMock.mockResolvedValueOnce({ id: 1, data: { foo: "bar" } });

		const result = await updateSubmission({ id: 1, data: { foo: "bar" } });

		expect(updateWhereMock).toHaveBeenCalledWith(
			{ id: 1, created_by: "user-1" },
			expect.objectContaining({ data: { foo: "bar" } }),
		);
		expect(result).toEqual({ id: 1, data: { foo: "bar" } });
	});

	it("updateSubmission normalizes tagged DateTime data", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		updateWhereMock.mockResolvedValue({ count: 1 });
		findByIdMock.mockResolvedValue({ id: 1 });

		await updateSubmission({
			id: 1,
			data: {
				established_since: {
					$type: "DateTime",
					value: "2019-01-01T00:00:00.000Z",
				},
			},
		});

		expect(updateWhereMock).toHaveBeenCalledWith(
			{ id: 1 },
			expect.objectContaining({
				data: {
					established_since: "2019-01-01T00:00:00.000Z",
				},
			}),
		);
	});

	it("updateSubmission throws a controlled error when the submission no longer exists", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		updateWhereMock.mockResolvedValue({ count: 0 });

		await expect(
			updateSubmission({ id: 999, data: { foo: "bar" } }),
		).rejects.toThrow("Submission no longer exists.");
	});

	it("reviewSubmission approval creates an institution with address and contact person subfields", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		findByIdMock.mockResolvedValue({
			id: 10,
			entity_type: SubmissionEntityType.institution,
			entity_id: null,
			type: SubmissionType.create,
			status: "approval_pending",
			created_by: null,
			meta: null,
			data: {
				name: "Submitted Institution",
				"address.streetLine": "Main 12",
				"address.zip": "10115",
				"address.city": "Berlin",
				"address.cultural_area": "Zentrum",
				contact_person: {
					first_name: "Ada",
					last_name: "Lovelace",
					email: "ada@example.com",
					phone: "+49 30 000000",
				},
			},
		});
		txInstitutionCreateMock.mockResolvedValue({ id: 123 });

		await reviewSubmission({ id: 10, status: "approved" });

		expect(txInstitutionCreateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					name: "Submitted Institution",
					address: {
						create: expect.objectContaining({
							street: "Main",
							street_number: "12",
							zipcode: "10115",
							city: "Berlin",
							cultural_area: "Zentrum",
						}),
					},
					contact_person: {
						create: {
							first_name: "Ada",
							last_name: "Lovelace",
							email: "ada@example.com",
							phone: "+49 30 000000",
						},
					},
				}),
			}),
		);
		expect(txSubmissionDeleteMock).toHaveBeenCalledWith({ where: { id: 10 } });
	});

	it("reviewSubmission approval updates only submitted address and contact person subfields", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		prismaInstitutionFindFirstMock.mockResolvedValue({ id: 55 });
		txInstitutionFindFirstMock.mockResolvedValue({
			id: 55,
			name: "Existing Institution",
			address_id: 77,
		});
		findByIdMock.mockResolvedValue({
			id: 11,
			entity_type: SubmissionEntityType.institution,
			entity_id: 55,
			type: SubmissionType.update,
			status: "approval_pending",
			created_by: null,
			meta: null,
			data: {
				"address.city": "Potsdam",
				contact_person_email: "updated@example.com",
			},
		});
		txInstitutionUpdateMock.mockResolvedValue({ id: 55 });

		await reviewSubmission({ id: 11, status: "approved" });

		expect(txInstitutionUpdateMock).toHaveBeenCalledWith({
			where: { id: 55 },
			data: expect.objectContaining({
				name: "Existing Institution",
				address: {
					update: expect.objectContaining({
						city: "Potsdam",
					}),
					create: expect.objectContaining({
						city: "Potsdam",
					}),
				},
				contact_person: {
					upsert: {
						create: { email: "updated@example.com" },
						update: { email: "updated@example.com" },
					},
				},
			}),
		});
		const updateData = txInstitutionUpdateMock.mock.calls[0][0].data;
		expect(updateData.address.update).not.toHaveProperty("street");
		expect(updateData.contact_person.upsert.update).not.toHaveProperty(
			"first_name",
		);
		expect(updateData.contact_person.upsert.update).not.toHaveProperty("phone");
		expect(txSubmissionDeleteMock).toHaveBeenCalledWith({ where: { id: 11 } });
	});

	it("saveSubmissionNote creates a note and returns the refreshed submission", async () => {
		getTableScopeMock.mockReturnValue("all");
		requireScopeOrUserMock.mockReturnValue(null);
		findByIdMock
			.mockResolvedValueOnce({
				id: 7,
				status: "approval_pending",
				created_by: "user-1",
			})
			.mockResolvedValueOnce({
				id: 7,
				status: "approval_pending",
				notes: [{ id: 1, note: "Review note" }],
			});
		createNoteMock.mockResolvedValue({ id: 1 });

		const result = await saveSubmissionNote({
			submissionId: 7,
			note: "Review note",
		});

		expect(createNoteMock).toHaveBeenCalledWith(
			expect.objectContaining({
				note: "Review note",
				submission: { connect: { id: 7 } },
			}),
		);
		expect(result).toEqual(
			expect.objectContaining({
				id: 7,
				notes: [{ id: 1, note: "Review note" }],
			}),
		);
	});
});
