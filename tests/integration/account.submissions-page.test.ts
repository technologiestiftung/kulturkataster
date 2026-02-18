import { describe, expect, it, vi } from "vitest";
import { InstitutionDraftReviewModal } from "@/components/Institution/InstitutionDraftReviewModal";

vi.mock("@/components/Institution/InstitutionDraftReviewModal", () => ({
	InstitutionDraftReviewModal: () => null,
}));

describe("account submissions page integration", () => {
	it("renders InstitutionDraftReviewModal with parsed submission id", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/submissions/[id]/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "88" }),
		});

		expect(result).toMatchObject({
			type: InstitutionDraftReviewModal,
			props: expect.objectContaining({
				submissionId: 88,
				routePath: "/account/submissions/88",
				returnTo: "/account/institutions",
			}),
		});
	});
});
