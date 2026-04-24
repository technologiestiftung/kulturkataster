import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	loadEmailTemplateBody,
	normalizeEmailTemplatePath,
} from "@/server/email/templates";

vi.mock("@/server/data/emailTemplateRepo", () => ({
	emailTemplateRepo: {
		getBodyByPath: vi.fn(),
	},
}));

vi.mock("@/server/logging/logger", () => ({
	logger: { warn: vi.fn() },
}));

import { emailTemplateRepo } from "@/server/data/emailTemplateRepo";
const getBodyByPathMock = vi.mocked(emailTemplateRepo.getBodyByPath);

describe("normalizeEmailTemplatePath", () => {
	it("joins path segments with a slash", () => {
		expect(normalizeEmailTemplatePath(["auth", "confirmation.html"])).toBe(
			"auth/confirmation.html",
		);
	});

	it("accepts a plain string", () => {
		expect(normalizeEmailTemplatePath("custom/invite.html")).toBe(
			"custom/invite.html",
		);
	});

	it("rejects path traversal", () => {
		expect(() => normalizeEmailTemplatePath("../secret.html")).toThrow(
			"Invalid template path",
		);
	});

	it("rejects paths with spaces", () => {
		expect(() => normalizeEmailTemplatePath("auth/my template.html")).toThrow(
			"Invalid template path",
		);
	});
});

describe("loadEmailTemplateBody", () => {
	beforeEach(() => {
		getBodyByPathMock.mockReset();
	});

	it("returns the database template when one is active", async () => {
		getBodyByPathMock.mockResolvedValue("<p>From database</p>");

		await expect(loadEmailTemplateBody("auth/confirmation.html")).resolves.toBe(
			"<p>From database</p>",
		);
	});

	it("falls back to the filesystem when the database returns null", async () => {
		getBodyByPathMock.mockResolvedValue(null);

		await expect(
			loadEmailTemplateBody("auth/confirmation.html"),
		).rejects.toThrow();
	});

	it("falls back to the filesystem when the database lookup throws", async () => {
		getBodyByPathMock.mockRejectedValue(new Error("DB error"));

		await expect(
			loadEmailTemplateBody("auth/confirmation.html"),
		).rejects.toThrow();
	});
});
