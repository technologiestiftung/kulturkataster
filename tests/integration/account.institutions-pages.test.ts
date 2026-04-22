import { describe, expect, it, vi } from "vitest";
import { InstitutionsTable } from "@/components/Institution";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { InstitutionEditModal } from "@/components/Institution/InstitutionEditModal";
import { SubmissionReviewModal } from "@/components/Institution/SubmissionReviewModal";

vi.mock("@/components/Institution", () => ({
	InstitutionsTable: () => null,
}));

vi.mock("@/components/Institution/InstitutionFormModal", () => ({
	InstitutionFormModal: () => null,
}));

vi.mock("@/components/Institution/InstitutionEditModal", () => ({
	InstitutionEditModal: () => null,
}));

vi.mock("@/components/Institution/InstitutionDraftReviewModal", () => ({
	InstitutionDraftReviewModal: () => null,
}));

vi.mock("@/components/Institution/SubmissionReviewModal", () => ({
	SubmissionReviewModal: () => null,
}));

describe("institutions pages integration", () => {
	it("renders institutions dashboard page with InstitutionsTable", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/institutions/page"
		);
		const result = pageModule.default();
		const suspense = result.props.children.props.children;

		expect(suspense.props.children.props.children).toMatchObject({
			type: InstitutionsTable,
		});
	});

	it("renders create institution page with proper modal props", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/institutions/new/page"
		);
		const result = pageModule.default();

		expect(result).toMatchObject({
			type: InstitutionFormModal,
			props: expect.objectContaining({
				mode: "create",
				routePath: "/account/institutions/new",
				returnTo: "/account/institutions",
			}),
		});
	});

	it("renders edit institution page with institution id", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/institutions/[id]/edit/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "42" }),
		});

		expect(result).toMatchObject({
			type: InstitutionEditModal,
			props: expect.objectContaining({
				institutionId: "42",
				routePath: "/account/institutions/42/edit",
				returnTo: "/account/institutions",
			}),
		});
	});

	it("renders submission review page with SubmissionReviewModal", async () => {
		const pageModule = await import(
			"@/app/[locale]/@modal/(.)account/submissions/[id]/page"
		);
		const result = await pageModule.default({
			params: Promise.resolve({ id: "77" }),
		});

		expect(result).toMatchObject({
			type: SubmissionReviewModal,
			props: expect.objectContaining({
				submissionId: 77,
				routePath: "/account/submissions/77",
			}),
		});
	});
});
