import { describe, expect, it, vi } from "vitest";
import { SubmissionReviewModal } from "@/components/Institution/SubmissionReviewModal";

vi.mock("@/components/Institution/SubmissionReviewModal", () => ({
	SubmissionReviewModal: () => null,
}));

describe("account submissions page integration", () => {
	it("renders SubmissionReviewModal with parsed submission id", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/submissions/[id]/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "88" }),
		});

		expect(result).toMatchObject({
			type: SubmissionReviewModal,
			props: expect.objectContaining({
				submissionId: 88,
				routePath: "/account/submissions/88",
			}),
		});
	});
});
