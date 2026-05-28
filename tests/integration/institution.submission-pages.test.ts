import { describe, expect, it, vi } from "vitest";
import { SubmissionReviewModal } from "@/components/Institution/SubmissionReviewModal";
import { InstitutionDraftWizardModal } from "@/components/Institution/InstitutionDraftWizardModal";
import { InstitutionDraftEditModal } from "@/components/Institution/InstitutionDraftEditModal";

vi.mock("@/components/Institution/SubmissionReviewModal", () => ({
	SubmissionReviewModal: () => null,
}));

vi.mock("@/components/Institution/InstitutionDraftWizardModal", () => ({
	InstitutionDraftWizardModal: () => null,
}));

vi.mock("@/components/Institution/InstitutionDraftEditModal", () => ({
	InstitutionDraftEditModal: () => null,
}));

vi.mock("@/server/actions/auth", () => ({
	getCurrentProfile: vi.fn().mockResolvedValue(null),
}));

describe("institution submission pages integration", () => {
	it("renders account submission review page with parsed id", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/submissions/[id]/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "123" }),
		});

		expect(result).toMatchObject({
			type: SubmissionReviewModal,
			props: expect.objectContaining({
				submissionId: 123,
				routePath: "/account/submissions/123",
			}),
		});
	});

	it("renders public submission page with InstitutionDraftWizardModal", async () => {
		const pageModule = await import(
			"@/app/[locale]/institution/(form)/submission/page"
		);
		const result = await pageModule.default();

		expect(result).toMatchObject({
			type: InstitutionDraftWizardModal,
			props: expect.objectContaining({
				routePath: "/institution/submission",
			}),
		});
	});

	it("renders account submission edit modal page with parsed id", async () => {
		const pageModule = await import(
			"@/app/[locale]/@modal/(.)account/submissions/[id]/edit/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "77" }),
		});

		expect(result).toMatchObject({
			type: InstitutionDraftEditModal,
			props: expect.objectContaining({
				submissionId: 77,
				routePath: "/account/submissions/77/edit",
			}),
		});
	});
});
