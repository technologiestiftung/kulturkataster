import { beforeEach, describe, expect, it, vi } from "vitest";
import { emailTemplateRepo } from "@/server/data/emailTemplateRepo";
import { prisma } from "@/server/prisma";

vi.mock("@/server/prisma", () => ({
	prisma: {
		emailTemplate: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

const findFirstMock = vi.mocked(prisma.emailTemplate.findFirst);
const findManyMock = vi.mocked(prisma.emailTemplate.findMany);

describe("emailTemplateRepo", () => {
	beforeEach(() => {
		findFirstMock.mockReset();
		findManyMock.mockReset();
	});

	describe("getBodyByPath", () => {
		it("returns the body of an active template", async () => {
			findFirstMock.mockResolvedValue({ body: "<p>Hello</p>" } as never);

			await expect(
				emailTemplateRepo.getBodyByPath("auth/confirmation.html"),
			).resolves.toBe("<p>Hello</p>");

			expect(findFirstMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { path: "auth/confirmation.html", is_active: true },
					select: { body: true },
				}),
			);
		});

		it("returns null when no active template is found", async () => {
			findFirstMock.mockResolvedValue(null);

			await expect(
				emailTemplateRepo.getBodyByPath("auth/confirmation.html"),
			).resolves.toBeNull();
		});
	});

	describe("listActive", () => {
		it("returns all active custom templates ordered by name", async () => {
			const templates = [
				{
					key: "custom.claim_approved",
					path: "custom/claim_approved.html",
					name: "Claim bestätigt",
					subject: null,
				},
				{
					key: "custom.submission_approved",
					path: "custom/submission_approved.html",
					name: "Einreichung bestätigt",
					subject: null,
				},
			];
			findManyMock.mockResolvedValue(templates as never);

			await expect(emailTemplateRepo.listActive()).resolves.toEqual(templates);

			expect(findManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { kind: "custom", is_active: true },
				}),
			);
		});
	});

	describe("findActiveByPath", () => {
		it("returns the template option for a given path", async () => {
			const template = {
				key: "custom.claim_approved",
				path: "custom/claim_approved.html",
				name: "Claim bestätigt",
				subject: null,
			};
			findFirstMock.mockResolvedValue(template as never);

			await expect(
				emailTemplateRepo.findActiveByPath("custom/claim_approved.html"),
			).resolves.toEqual(template);
		});

		it("returns null when no active template matches the path", async () => {
			findFirstMock.mockResolvedValue(null);

			await expect(
				emailTemplateRepo.findActiveByPath("custom/nonexistent.html"),
			).resolves.toBeNull();
		});
	});
});
