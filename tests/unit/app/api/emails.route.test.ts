import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/email/templates", () => ({
	loadEmailTemplateBody: vi.fn(),
}));

import { GET } from "@/app/api/emails/[...templatePath]/route";
import { loadEmailTemplateBody } from "@/server/email/templates";

const loadEmailTemplateBodyMock = vi.mocked(loadEmailTemplateBody);

describe("GET /api/emails/[...templatePath]", () => {
	beforeEach(() => {
		loadEmailTemplateBodyMock.mockReset();
	});

	it("renders markdown CTA links as styled buttons in preview mode", async () => {
		loadEmailTemplateBodyMock.mockResolvedValue(
			"[Zum Portal]({{ .Data.portal_url }})",
		);

		const response = await GET(
			new Request(
				"http://127.0.0.1:3000/api/emails/custom/claim_approved.html",
			),
			{
				params: Promise.resolve({
					templatePath: ["custom", "claim_approved.html"],
				}),
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"text/html; charset=utf-8",
		);

		const html = await response.text();
		expect(html).toContain('href="{{ .Data.portal_url }}"');
		expect(html).toContain('style="display:inline-block;background:#c288ff;');
		expect(html).toContain('<p style="margin:0 0 16px 0;">');
	});
});
