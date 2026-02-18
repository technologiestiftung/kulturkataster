import { describe, expect, it } from "vitest";

describe("account claim page integration", () => {
	it("renders InstitutionClaimSelectModal with claim route path", async () => {
		const pageModule = await import(
			"@/app/[locale]/account/(dashboard)/submissions/claim/page"
		);
		const element = pageModule.default();

		expect(element.props.routePath).toBe("/account/submissions/claim");
	});
});
