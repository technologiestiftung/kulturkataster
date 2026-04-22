import { describe, expect, it, vi } from "vitest";
import { InstitutionClaimSelectModal } from "@/components/Institution/InstitutionClaimSelectModal";

vi.mock("@/components/Institution/InstitutionClaimSelectModal", () => ({
	InstitutionClaimSelectModal: () => null,
}));

describe("account claim page integration", () => {
	it("renders InstitutionClaimSelectModal with claim route path", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/submissions/claim/page"
		);
		const element = pageModule.default();

		expect(element).toMatchObject({
			type: InstitutionClaimSelectModal,
			props: expect.objectContaining({
				routePath: "/account/submissions/claim",
			}),
		});
	});
});
